var canvas,
    wave, 
    sound,
    amplitude,
    img;

function preload() {
    sound = loadSound('mischa.mp3');
    img   = loadImage("gradient.png");
}    

function setup() {
    canvas = createCanvas(window.innerWidth, window.innerHeight, WEBGL);
    wave   = new Wave(10, 0.9, 0.7, 50);    
    canvas.mouseClicked(togglePlay);
    noStroke();    
    sound.setVolume(1);
    sound.play();
}

function togglePlay() {
  if (sound.isPlaying()) {
    sound.pause();
  } else {
    sound.loop();
  }
}

function draw() {
    background(0);
    wave.update();
    wave.sphericalWave();
}

window.onresize = function() {
    var w = window.innerWidth;
    var h = window.innerHeight;  

    wave   = new Wave(w/ 10, 0.7, 0.7, h / 10);    
    canvas.size(w,h);
    width  = w;
    height = h;
};

function Wave(amplitude, friction, expansion, waveLength) {
    this.amplitude  = amplitude;
    this.friction   = friction;
    this.expansion  = expansion;
    this.waveLength = waveLength;

    // Time related parameters
    this.time      = 0;
    this.step      = 0.1;
    this.detailY   = 32 - 1;
    this.detailX   = 32 - 1;
    this.fft       = new p5.FFT(0.1, 32);
    this.soundAmp  = new p5.Amplitude(0.1);
    this.level     = this.soundAmp.getLevel();  
    this.spectrum  = this.fft.analyze();

    // Internal Config
    this.eps       = 1;
    this.minStep   = 15;  // minimal triangle vertex length
    this.maxStep   = 100; // maximum number of steps
    this.partition = 20;
};

Wave.prototype.height = function(x) {
    return (this.amplitude + this.step) * (pow(this.friction, x / this.amplitude));
}

Wave.prototype.fn = function(x) {   
    var period = this.waveLength * (log(exp(1) + x) / log(exp(1) + 1 / this.expansion));
    return this.height(x) * cos(TWO_PI * x / period - this.time);
}

Wave.prototype.update = function() {    
    this.level    = this.soundAmp.getLevel();
    this.step     = this.level;
    this.time    += this.step;
    this.spectrum = this.fft.analyze();
}

Wave.prototype.getSpectrum = function(j) {
    try {
        return pow(map(this.spectrum[j], 0, 255, 0, 1), 1);
    } catch(e) {
        return 1;
    }
}

Wave.prototype.sphericalWave = function() {
    var radius = 150;
    var wave = this;

    rotateX(wave.time * 0.1);     
    
    texture(img);
    ambientMaterial(0);   

    // specularMaterial(255);
    pointLight(255, 255, 255, 1500, 1500, 0);  

    //  directionalLight(255, 255, 255, 0, 0, 0);

    gId = 'NotCached' + '|' + wave.time;
  
    if(!_renderer.geometryInHash(gId)) {
        var _sphere = function() {
            var u,v,p;
            for (var i = 0; i <= this.detailY; i++){
                v = i / this.detailY;
                for (var j = 0; j <= this.detailX; j++){
                    u = j / this.detailX;
                    var theta = 2 * Math.PI * u;
                    var phi = Math.PI * v - Math.PI / 2;
                    var waveRadius = radius * cos(phi);
                    var currentRadius = radius + wave.fn(waveRadius);

                    p = new p5.Vector(currentRadius * Math.cos(phi) * Math.sin(theta),
                    currentRadius * Math.sin(phi),
                    currentRadius * Math.cos(phi) * Math.cos(theta));
                    this.vertices.push(p);                
                    this.uvs.push([u, v]);
                }
            }

            console.log(this.uvs[0]);
        };
        var sphereGeom = new p5.Geometry(this.detailX, this.detailY, _sphere);
        sphereGeom
          .computeFaces()
          .computeNormals()
          .averageNormals()
          .averagePoleNormals();
        _renderer.createBuffers(gId, sphereGeom);  
    }   
    _renderer.drawBuffers(gId);

    return this;
};
