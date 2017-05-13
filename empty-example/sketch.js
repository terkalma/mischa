var canvas,
    wave;

function setup() {
    canvas = createCanvas(window.innerWidth, window.innerHeight, WEBGL);
    wave   = new Wave(window.innerWidth / 10, 0.7, 0.7, window.innerHeight / 10);    

    noStroke();
}

function draw() {
    background(0);

    pointLight(255, 0, 0, 0, 0, 0);
    wave.wave();
    wave.update();
    console.log(frameRate());
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
    this.time = 0;
    this.step = 0.1;

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
    this.time += this.step;
}

var axis = function() {
    beginShape(LINES);

    fill(255, 0, 0);
    vertex(0, 0, 0);
    vertex(200, 0, 0);

    fill(0, 255, 0);
    vertex(0, 0, 0);
    vertex(0, 200, 0);

    fill(0, 0, 255);
    vertex(0, 0, 0);
    vertex(0, 0, 200);
    
    endShape();
}

Wave.prototype.wave = function() {       
    var radius = 0,    
        currentHeight = this.height(0),
        angleStep = TWO_PI / (this.partition - 1),
        step = 0,
        angle = 0,        
        currentStep = 0,
        brightness = 0,
        sinA = [], 
        cosA = [],        
        currentZ, currentRadius;

    push();      
    rotateX(-PI / 6);
    beginShape(TRIANGLE_STRIP);   

    for (i=0; i <= this.partition; i++) {
        sinA.push(sin(angleStep * i));
        cosA.push(cos(angleStep * i));        
    }

    while (currentHeight > this.eps && currentStep < this.maxStep) {                 
        step = max(this.amplitude / (currentHeight + this.eps), this.minStep);          

        for (i=0; i <= this.partition; i++) {  
            if (i % 2 == 0) {
                currentRadius = radius;
            } else {
                currentRadius = radius + step;
            }

            currentZ = this.fn(currentRadius);                         
                        
            fill(map(currentZ, -this.amplitude, +this.amplitude, 0, 255));        
            vertex(cosA[(i + currentStep) % this.partition] * currentRadius, 
                sinA[(i + currentStep) % this.partition] * currentRadius, currentZ);                                                
        }     
    
        radius += step;
      
        currentHeight = this.height(radius);   
        currentStep += 1;                   
    } 
    endShape();
    pop();

    axis();
}