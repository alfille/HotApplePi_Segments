// Javascript genetic algorithm for solving best volume

// find segment lengths to solve Paul Alfille's HotApplePi problem
// Javascript E6+ code

// See https://github.com/alfille/HotApplePi

// Plots Flat and Folded profiles
// 2 setup messages "Flat( canvas)", "Folded( canvas)"
// 2 working messages: "start( targetX, targetY, seq)" and "show( F, seq)"

class CanvasType {
	constructor(canvas) {
		this.Xdim = 1.0 ;
		this.Ydim = .4 ;
		this.canvas = canvas ;
		this.ctx=this.canvas.getContext("2d",{willReadFrequently:true,});
		this.startX = 10 ;
		this.startY = 10 ;
		this.lengX = this.canvas.width - 2* this.startX ;
		this.lengY = this.canvas.height - 2* this.startY ;
		this.ctx.globalAlpha = 1.0 ;
		this.ctx.font="10px Arial" ;
		this.targetX = null ;
		this.targetY = null ;
	}
	
	clear() {
		this.ctx.fillStyle = "white" ;
		this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height) ;
		this.ctx.strokeStyle = "lightgray" ;
		this.ctx.lineWidth = 1 ;
		for ( let p = 0; p <= this.Xdim ; p += .1 ) {
			// grid
			this.ctx.beginPath() ;
			this.ctx.moveTo( this.pX(p),this.pY(0) ) ;
			this.ctx.lineTo( this.pX(p),this.pY(this.Ydim) ) ;
			this.ctx.stroke() ;
		}
		for ( let q = 0; q <= this.Ydim ; q += .1 ) {
			// grid
			this.ctx.beginPath() ;
			this.ctx.moveTo( this.pX(0),this.pY(q) ) ;
			this.ctx.lineTo( this.pX(this.Xdim),this.pY(q) ) ;
			this.ctx.stroke() ;
		}
		this.ctx.fillStyle = "gray" ;
		for ( let q = .1; q <= this.Ydim ; q += .1 ) {
			this.ctx.fillText(Number(q).toFixed(2).replace(/0$/,""),this.pX(0),this.pY(q))
		}
		this.copyImg() ;
	}
	
	pX( x ) {
		return x*this.lengX/this.Xdim + this.startX ;
	} 
	
	pY( y ) {
		return (this.Ydim-y)*this.lengY/this.Ydim + this.startY ;
	}

	ppY( y ) {
		// target Y clipped to bounds
		return (this.Ydim-Math.max(0,Math.min(y,this.Ydim)))*this.lengY/this.Ydim + this.startY ;
	}

	target() {
		this.pasteImg() ;
		//console.log(X,Y);

		// pass 1 in pink
		this.ctx.beginPath() ;
		this.ctx.strokeStyle="pink" ;
		this.ctx.lineWidth = 4 ;
		this.ctx.moveTo(this.pX(this.targetX[0]),this.ppY(this.targetY[0]));
		this.targetY.slice(1).forEach( (y,i) => {
			this.ctx.lineTo( this.pX(this.targetX[i]), this.ppY(y) ) ;
		});
		this.ctx.stroke() ;

		// pass 2 out-of-bounds in red (over-writing)
		let oob = 0 ; // number of consecutive oob segments
		this.ctx.strokeStyle="red" ;
		this.ctx.lineWidth = 2 ;
		this.targetY.slice(1).forEach( (y,i) => {
			if ( this.pY(y) != this.ppY(y) ) {
				if ( oob == 0 ) {
					this.ctx.beginPath();
					this.ctx.moveTo( this.pX(this.targetX[i-1]), this.ppY(this.targetY[i-1]) );
				}
				this.ctx.lineTo( this.pX(this.targetX[i]), this.ppY(y) ) ;
				oob += 1 ;
			} else if ( oob > 0 ) {
				this.ctx.stroke() ;
				oob = 0 ;
			}
		});
		if ( oob > 0 ) {
			this.ctx.stroke() ;
		}

		this.copyImg() ;
	}
	
	curve(F) {
		X=this.Xs(F);
		this.pasteImg() ;
		//console.log(X,Y);

		// pass 1 in black
		this.ctx.beginPath() ;
		this.ctx.strokeStyle="black" ;
		this.ctx.lineWidth = 1 ;
		this.ctx.moveTo(this.pX(X[0]),this.pY(F[0]));
		this.X.slice(1).forEach( (x,i) => {
			this.ctx.lineTo( this.pX(x), this.pY(F[i]) ) ;
		});
		this.ctx.stroke() ;

		this.copyImg() ;

		// pass 2 in red
		this.ctx.beginPath() ;
		this.ctx.strokeStyle="green";
		this.ctx.lineWidth = 4 ;
		this.ctx.moveTo(this.pX(X[0]),this.pY(F[0]));
		this.X.slice(1).forEach( (x,i) => {
			this.ctx.lineTo( this.pX(x), this.pY(F[i]) ) ;
		});
		this.ctx.stroke() ;
	}
	
	copyImg () {
		this.imgData = this.ctx.getImageData(this.startX,this.startY,this.lengX,this.lengY);
	}
	
	pasteImg () {
		this.ctx.putImageData( this.imgData,this.startX,this.startY);
	}
}

class CanvasFlat extends CanvasType {
	Xs(F) {
		return this.targetX ;
	}
}

class CanvasFolded extends CanvasType {
	Xs(F) {
		let sum = 0. ;
		const FoldedX = this.targetX
			.slice(1)
			.map( (x,i) => {
				sum += Math.sqrt( (x-this.targetX[i-1])**2 -(F[i]-F[i-1])**2 ) ;
			return sum;
		});
		FoldedX.unshift( 0. );
		return FoldedX.map( x => x + (1-sum)/2 ) ; // centering
	}
}

var Flat = null ;
var Folded = null ;
var seq ;

onmessage = ( evt ) => {
	if ( evt.isTrusted ) {
		//console.log("Worker gets: ",evt.data.type);
		switch (evt.data.type) {
			case "Flat":
				Flat = new CanvasFlat(evt.data.canvas) ;
				break ;
			case "Folded":
				Folded = new CanvasFolded(evt.data.canvas) ;
				break ;
			case "start":
				seq = evt.data.seq ;

				Flat.targetX = evt.data.X ;
				Flat.targetY = evt.data.Y ;
				Flat.clear() ;
				Flat.target() ;

				Folded.targetX = evt.data.X ;
				Folded.targetY = evt.data.Y ;
				Folded.clear() ;
				break ;
			case "show":
				seq = evt.data.seq ;

				Flat.curve(evt.data.F) ; 
				Folded.curve(evt.data.F) ; 
				break ;
		}
	} else {
		console.log("Worker: Message not trusted");
	}
}

