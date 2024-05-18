// https://github.com/tidwall/pinhole-js
//
// Copyright 2023 Joshua J Baker. All rights reserved.
// Use of this source code is governed by an MIT-style
// license that can be found in the LICENSE file.

class Pinhole {
    constructor(canvas){
		this.canvas = canvas ;
		this.stopped = true ;
		this.global_scale = 1. ; // default
		this.ctx=this.canvas.getContext("2d",{willReadFrequently:true,});
        // actions on stack, if any, else all
        
        // Rotator stuff
        this.degree = Math.PI/180 ;
		this.inc = this.degree/10;
		this.clear() ;
		this.render_opts={ bgColor:"white", lineWidth:1 } ;
    }
    
    clear() {
		this.ctx.fillStyle = "white" ;
		this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height) ;
		// lines is total graphic elements
        this.lines = [];
        // stack is start of individual elements ( begin -> end )
        this.stack = [];
		this.Stop() ;
	}
    
    begin(){
        this.stack.push(this.lines.length);
    }
    
    end(){
        this.stack.pop();
    }
    
    _stackstart(){
		if (this.stack.length==0) {
			return 0 ;
		}
		return this.stack[this.stack.length-1];
	}
    
    rotate(x, y, z){
        for (let i = this._stackstart(); i < this.lines.length; i++) {
            if (x != 0) {
                this.lines[i].p1 = this._rotateX(this.lines[i].p1, x);
                this.lines[i].p2 = this._rotateX(this.lines[i].p2, x);
            }
            if (y != 0) {
                this.lines[i].p1 = this._rotateY(this.lines[i].p1, y);
                this.lines[i].p2 = this._rotateY(this.lines[i].p2, y);
            }
            if (z != 0) {
                this.lines[i].p1 = this._rotateZ(this.lines[i].p1, z);
                this.lines[i].p2 = this._rotateZ(this.lines[i].p2, z);
            }
        }
    }

    // https://www.siggraph.org/education/materials/HyperGraph/modeling/mod_tran/3drota.htm
    _rotateX(p, q){
        return {
			x:p.x,
			y:p.y*Math.cos(q) - p.z*Math.sin(q),
			z:p.y*Math.sin(q) + p.z*Math.cos(q)
			}
    }

    _rotateY(p, q){
        return {
			x:p.z*Math.sin(q) + p.x*Math.cos(q),
			y:p.y,
			z:p.z*Math.cos(q) - p.x*Math.sin(q)
			}
    }

    _rotateZ(p, q){
        return {
			x:p.x*Math.cos(q) - p.y*Math.sin(q),
			y:p.x*Math.sin(q) + p.y*Math.cos(q),
			z:p.z
			}
    }
    
    translate(x, y, z){
        for (let i = this._stackstart(); i < this.lines.length; i++) {
            this.lines[i].p1.x += x;
            this.lines[i].p1.y += y;
            this.lines[i].p1.z += z;
            this.lines[i].p2.x += x;
            this.lines[i].p2.y += y;
            this.lines[i].p2.z += z;
        }
    }
    
    scale(x, y, z){
        for (let i = this._stackstart(); i < this.lines.length; i++) {
            this.lines[i].p1.x *= x;
            this.lines[i].p1.y *= y;
            this.lines[i].p1.z *= z;
            this.lines[i].p2.x *= x;
            this.lines[i].p2.y *= y;
            this.lines[i].p2.z *= z;
        }
    }
    
    colorize(color){
        for (let i = this._stackstart(); i < this.lines.length; i++) {
            this.lines[i].color = color;
        }
    }
    
    center(){
		let i = this._stackstart() ;
		if ( i >= this.lines.length ) {
			return ;
		}
        let minx = Number.POSITIVE_INFINITY;
        let miny = Number.POSITIVE_INFINITY;
        let minz = Number.POSITIVE_INFINITY;
        let maxx = Number.NEGATIVE_INFINITY;
        let maxy = Number.NEGATIVE_INFINITY;
        let maxz = Number.NEGATIVE_INFINITY;
        for ( ; i < this.lines.length; i++) {
            if (this.lines[i].p1.x < minx) {
                minx = this.lines[i].p1.x;
            }
            if (this.lines[i].p1.x > maxx) {
                maxx = this.lines[i].p1.x;
            }
            if (this.lines[i].p1.y < miny) {
                miny = this.lines[i].p1.y;
            }
            if (this.lines[i].p1.y > maxy) {
                maxy = this.lines[i].p1.y;
            }
            if (this.lines[i].p1.z < minz) {
                minz = this.lines[i].p1.z;
            }
            if (this.lines[i].p1.z > maxz) {
                maxz = this.lines[i].p1.z;
            }
            if (this.lines[i].p2.x < minx) {
                minx = this.lines[i].p2.x;
            }
            if (this.lines[i].p2.x > maxx) {
                maxx = this.lines[i].p2.x;
            }
            if (this.lines[i].p2.y < miny) {
                miny = this.lines[i].p2.y;
            }
            if (this.lines[i].p2.y > maxy) {
                maxy = this.lines[i].p2.y;
            }
            if (this.lines[i].p2.z < minz) {
                minz = this.lines[i].p2.z;
            }
            if (this.lines[i].p2.z > maxz) {
                maxz = this.lines[i].p2.z;
            }
        }
        const x = (maxx + minx) / 2;
        const y = (maxy + miny) / 2;
        const z = (maxz + minz) / 2;
        this.translate(-x, -y, -z);
    }
    
    drawCube(minx, miny, minz, maxx, maxy, maxz) {
        this.drawLine(minx, maxy, minz, maxx, maxy, minz)
        this.drawLine(maxx, maxy, minz, maxx, miny, minz)
        this.drawLine(maxx, miny, minz, minx, miny, minz)
        this.drawLine(minx, miny, minz, minx, maxy, minz)
        this.drawLine(minx, maxy, maxz, maxx, maxy, maxz)
        this.drawLine(maxx, maxy, maxz, maxx, miny, maxz)
        this.drawLine(maxx, miny, maxz, minx, miny, maxz)
        this.drawLine(minx, miny, maxz, minx, maxy, maxz)
        this.drawLine(minx, maxy, minz, minx, maxy, maxz)
        this.drawLine(maxx, maxy, minz, maxx, maxy, maxz)
        this.drawLine(maxx, miny, minz, maxx, miny, maxz)
        this.drawLine(minx, miny, minz, minx, miny, maxz)
    }
    
    drawDot(x, y, z, radius){
        this.drawLine(x, y, z, x, y, z)
        this.lines[this.lines.length-1].scale = 10 / 0.1 * radius;
    }
    
    drawLine(x1, y1, z1, x2, y2, z2) {
        this.lines.push({
            p1:{x:x1,y:y1,z:z1},
            p2:{x:x2,y:y2,z:z2},
            color:'black',
            scale:1
        })
    }
    
    drawCircle(x, y, z, radius) {
        let f, l;
        let first, prev;
        const circleSteps = this.circleSteps||45;
        // we go one beyond the steps because we need to join at the end
        for (let i = 0; i <= circleSteps; i++) {
            const d = this._destination(x, y, (Math.PI*2)/circleSteps*i, radius);
            d.z = z
            if (i > 0) {
                if (i == circleSteps) {
                    this.drawLine(l.x, l.y, l.z, f.x, f.y, f.z);
                } else {
                    this.drawLine(l.x, l.y, l.z, d.x, d.y, d.z);
                }
                const line = this.lines[this.lines.length-1]
                line.nocaps = false;
                //line.circle = true;
                if (!first) {
                    first = line;
                }
                line.cfirst = first;
                line.cprev = prev;
                if (prev) {
                    prev.cnext = line;
                }
                prev = line;
    
            } else {
                f = d;
            }
            l = d;
        }
    }
    
    drawEllipse(x, y, z, radiusa, radiusb) {
        let f, l;
        let first, prev;
        const circleSteps = this.circleSteps||45;
        // we go one beyond the steps because we need to join at the end
        for (let i = 0; i <= circleSteps; i++) {
            const d = this._destination2(x, y, (Math.PI*2)/circleSteps*i, radiusa, radiusb);
            d.z = z
            if (i > 0) {
                if (i == circleSteps) {
                    this.drawLine(l.x, l.y, l.z, f.x, f.y, f.z);
                } else {
                    this.drawLine(l.x, l.y, l.z, d.x, d.y, d.z);
                }
                const line = this.lines[this.lines.length-1]
                line.nocaps = false;
                //line.circle = true;
                if (!first) {
                    first = line;
                }
                line.cfirst = first;
                line.cprev = prev;
                if (prev) {
                    prev.cnext = line;
                }
                prev = line;

            } else {
                f = d;
            }
            l = d;
        }
    }
    
    _capsInsert(caps, x, y, z){
        const key = x+":"+y+":"+z;
        if (!caps[key]){
            caps[key] = true;
            return true;
        }
        return false;
    }
    
    _compareLines(a, b){
        const az = Math.min(a.p1.z, a.p2.z);
        const bz = Math.min(b.p1.z, b.p2.z);
        if (az > bz){
            return -1;
        } else if (az < bz) {
            return +1;
        }
        const ay = Math.min(a.p1.y, a.p2.y);
        const by = Math.min(b.p1.z, b.p2.y);
        if (ay < by){
            return -1;
        } else if (ay > by) {
            return +1;
        }
        const ax = Math.min(a.p1.x, a.p2.x);
        const bx = Math.min(b.p1.x, b.p2.x);
        if (ax < bx){
            return -1;
        } else if (ax > bx) {
            return +1;
        }
        return 0;
    }
    
    render(opts=this.render_opts){
        const optsScale = (opts?opts.scale:null)||1;
        const optsLineWidth = (opts?opts.lineWidth:null)||1;
        const optsBGColor = (opts?opts.bgColor:null)||'white';
        const width = this.canvas.width;
        const height = this.canvas.height;
        const c = this.ctx;
        this.lines.sort(this._compareLines);
        for (let i=0;i<this.lines.length;i++){
            this.lines[i].drawcoords = null;
        }
        if (optsBGColor) {
            c.fillStyle = optsBGColor;
            c.fillRect(0, 0, width, height);
        }
        const capsMap = {};
        let caps;
        let ccolor;
        const focal = Math.min(width, height) / 2;
        const maybeDraw = (line) => {
            const p1 = this._projectPoint(line.p1.x, line.p1.y, line.p1.z, width, height, focal, optsScale)
            const p2 = this._projectPoint(line.p2.x, line.p2.y, line.p2.z, width, height, focal, optsScale)
            const t1 = this._lineWidthAtZ(line.p1.z, focal) * optsLineWidth * line.scale;
            const t2 = this._lineWidthAtZ(line.p2.z, focal) * optsLineWidth * line.scale;
            let cap1, cap2;
            if (!line.nocaps) {
                cap1 = this._capsInsert(caps, p1.x, p1.y, p1.z);
                cap2 = this._capsInsert(caps, p2.x, p2.y, p2.z);
            }
            return this._drawUnbalancedLineSegment(c,
                p1.x, p1.y, p2.x, p2.y,
                t1, t2,
                cap1, cap2,
                line.circle
            )
        }
        for (let i=0;i<this.lines.length;i++){
            const line = this.lines[i];
            if (line.color != ccolor) {
                ccolor = line.color;
                caps = capsMap[ccolor];
                if (!caps){
                    caps = {};
                    capsMap[ccolor] = caps;
                }
                c.fillStyle = ccolor;
            }
            if (line.circle) {
                if (!line.drawcoords){
                    // need to process the coords for all segments belonging to
                    // the current circle segment.
                    // first get the basic estimates
                    const coords = [];
                    const seg = line.cfirst;
                    while (seg){
                        seg.drawcoords = maybeDraw(seg);
                        if (!seg.drawcoords) {
                            throw("nil!");
                        }
                        coords.push(seg.drawcoords);
                        seg = seg.cnext;

                    }
                    // next reprocess to join the midpoints
                    for (let j = 0; j < coords.length;j++){
                        let line1, line2;
                        if (j == 0) {
                            line1 = coords[coords.length-1];
                        } else {
                            line1 = coords[j-1];
                        }
                        line2 = coords[j];
                        const midx1 = (line2.x1 + line1.x4) / 2;
                        const midy1 = (line2.y1 + line1.y4) / 2;
                        const midx2 = (line2.x2 + line1.x3) / 2;
                        const midy2 = (line2.y2 + line1.y3) / 2;
                        line2.x1 = midx1;
                        line2.y1 = midy1;
                        line1.x4 = midx1;
                        line1.y4 = midy1;
                        line2.x2 = midx2;
                        line2.y2 = midy2;
                        line1.x3 = midx2;
                        line1.y3 = midy2;
                    }
                }
                // draw the cached coords
                c.beginPath();
                c.moveTo(line.drawcoords.x1-Number.MIN_VALUE, line.drawcoords.y1-Number.MIN_VALUE)
                c.lineTo(line.drawcoords.x2-Number.MIN_VALUE, line.drawcoords.y2-Number.MIN_VALUE)
                c.lineTo(line.drawcoords.x3+Number.MIN_VALUE, line.drawcoords.y3+Number.MIN_VALUE)
                c.lineTo(line.drawcoords.x4+Number.MIN_VALUE, line.drawcoords.y4+Number.MIN_VALUE)
                c.lineTo(line.drawcoords.x1-Number.MIN_VALUE, line.drawcoords.y1-Number.MIN_VALUE)
                c.closePath();
                c.fill();
            } else {
                maybeDraw(line);
            }
        }
    }
    
    _drawUnbalancedLineSegment(c, x1, y1, x2, y2, t1, t2, cap1, cap2, circleSegment) {
        if (x1 == x2 && y1 == y2) {
            c.beginPath();
            c.arc(x1, y1, t1/2, 0, 2 * Math.PI, false);
            c.closePath();
            c.fill();
            return null;
        }
        const a = this._lineAngle(x1, y1, x2, y2);
        const d1 = this._destination(x1, y1, a-Math.PI/2, t1/2);
        const d2 = this._destination(x1, y1, a+Math.PI/2, t1/2);
        const d3 = this._destination(x2, y2, a+Math.PI/2, t2/2);
        const d4 = this._destination(x2, y2, a-Math.PI/2, t2/2);
        if (circleSegment) {
            return {x1:d1.x, y1:d1.y, x2:d2.x, y2:d2.y, x3:d3.x, y3:d3.y, x4:d4.x, y4:d4.y};
        }
        const cubicCorner = 1.0 / 3 * 2; //0.552284749831
        if (cap1 && t1 < 2) {
            cap1 = false;
        }
        if (cap2 && t2 < 2) {
            cap2 = false;
        }
        c.beginPath();
        c.moveTo(d1.x, d1.y);
        if (cap1) {
            const a1 = this._destination(d1.x, d1.y, a-Math.PI*2, t1*cubicCorner);
            const a2 = this._destination(d2.x, d2.y, a-Math.PI*2, t1*cubicCorner);
            c.bezierCurveTo(a1.x, a1.y, a2.x, a2.y, d2.x, d2.y);
        } else {
            c.lineTo(d2.x, d2.y);
        }
        c.lineTo(d3.x, d3.y);
        if (cap2) {
            const a1 = this._destination(d3.x, d3.y, a-Math.PI*2, -t2*cubicCorner);
            const a2 = this._destination(d4.x, d4.y, a-Math.PI*2, -t2*cubicCorner);
            c.bezierCurveTo(a1.x, a1.y, a2.x, a2.y, d4.x, d4.y);
        } else {
            c.lineTo(d4.x, d4.y);
        }
        c.lineTo(d1.x, d1.y);
        c.closePath();
        c.fill();
        return null;
    }
    // projectPoint projects a 3d point cartesian point to 2d screen coords.
    //     Origin is the center
    //     X is left/right
    //     Y is down/up
    //     Z is near/far, the 0 position is focal distance away from lens.
    _projectPoint(
        x, y, z, // 3d point to project
        w, h, f, // width, height, focal
        scale // scale
    ) { // projected point
        x = x*scale*f;
        y = y*scale*f;
        z = z*scale*f;
        let zz = z + f;
        if (zz == 0) {
            zz = Math.MIN_VALUE;
        }
        const p = {};
        p.x = x*(f/zz) + w/2;
        p.y = y*(f/zz) - h/2;
        p.y *= -1;
        return p;
    }
    
    _lineWidthAtZ(z, f) {
//        return ((z*-1 + 1) / 2) * f * 0.04;
        return ((z*-1 + 1) / 2) * f * 0.01;
    }
    
    _lineAngle(x1, y1, x2, y2){
        return Math.atan2(y1-y2, x1-x2)
    }
    
    _destination(x, y, angle, distance){
        return {
            x: x + Math.cos(angle)*distance,
            y: y + Math.sin(angle)*distance,
        }
    }
    
    _destination2(x, y, angle, distancea, distanceb){
        return {
            x: x + Math.cos(angle)*distancea,
            y: y + Math.sin(angle)*distanceb,
        }
    }
    
    unpack( oplist ) {
		this.begin() ;
		oplist.forEach( op => {
			switch ( op[0] ) {
				case "center":
					this.center( ...op[1] ) ;
					break ;
				case "colorize":
					this.colorize( ...op[1] ) ;
					break ;
				case "drawCircle":
					this.drawCircle( ...op[1] ) ;
					break ;
				case "drawCube":
					this.drawCube( ...op[1] ) ;
					break ;
				case "drawDot":
					this.drawDot( ...op[1] ) ;
					break ;
				case "drawEllipse":
					this.drawEllipse( ...op[1] ) ;
					break ;
				case "drawLine":
					this.drawLine( ...op[1] ) ;
					break ;
				case "rotate":
					this.rotate( ...op[1] ) ;
					break ;
				case "scale":
					this.scale( ...op[1] ) ;
					break ;
				case "translate":
					this.translate( ...op[1] ) ;
					break ;
				default:
					console.error("Unrecognized op",op);
					break ;
			}
			}) ;
		this.scale( this.global_scale, this.global_scale, this.global_scale ) ;
		this.end() ;
	}
	
	set_global_scale( s ) {
		this.global_scale = s ;
	}	


	// Rotator Methods
	
	Stop() {
		this.dx = 0 ;
		this.dy = 0 ;
		this.dz = 0 ;
		this.Delta(0,0,0);
	}
	
	Delta(x,y,z) {
		this.dx += x*this.inc ;
		this.dy += y*this.inc ;
		this.dz += z*this.inc ;
		if ( (this.dx==0) && (this.dy==0) && (this.dz==0) ) {
			this.stopped = true ;
		} else {
			this.stopped = false ;
		}
		this.Run() ;
	}
	
	Step() {
		this.rotate( this.dx, this.dy, this.dz ) ;
	}
	
	Frame(canvas) {
		this.Step() ;
		this.render();
	}
	
	Run( canvas ) {
		if ( this.stopped ) {
			this.render();
		} else {
			const frame = () => {
				this.Step();
				this.render();
				if ( ! this.stopped ) {
					self.requestAnimationFrame(frame);
				}
			}
			self.requestAnimationFrame(frame);
		}
	}		
}

var pin = null;

onmessage = (evt) => {
	if ( evt.isTrusted ) {
		switch ( evt.data.type ) {
			case "new":
				pin = new Pinhole( evt.data.canvas ) ;
				break ;
			case "ops":
				pin.unpack( evt.data.value ) ;
				pin.Run()
				break ;
			case "rotate":
				pin.Delta( ...evt.data.value ) ;
				break ;
			case "turn":
				pin.rotate( ...evt.data.value ) ;
				pin.Delta( 0,0,0 ) ;
				break ;
			case "scale":
				pin.set_global_scale( evt.data.value ) ;
				break ;
			case "stop":
			    pin.Stop() ;
			    break ;
			case "clear":
				pin.clear() ;
				break ;
		}
	}
}

