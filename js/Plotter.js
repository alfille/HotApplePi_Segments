// Javascript genetic algorithm for solving best volume

// find segment lengths to solve Paul Alfille's HotApplePi problem
// Javascript E6+ code

// See https://github.com/alfille/HotApplePi

// Problem constraints:
// for N+1 segments
//   all segment lengths: 0 <= u <= Lhat
//   u[0] = u[N] = 0
//   | u[i] - u[i+1] | <= 1/N

const Settings = {
	N:		100, 	// number of segments
	Pop:	1000, 	// Candidates/generation
	Lhat:	2.0, 	// Relative length side to (unfolded) width
	generations:	1000,	// short timeline
} ;

class Run {
	constructor () {
		this.flat = null;
		this.folded = null ;
	}
	
	start() {
		this.flat.clear() ;
		this.folded.clear() ;
	}
	
	run(u) {
		this.flat.add_data(u) ;
		//console.log("flat add");
		this.folded.add_data(u) ;
		//console.log("folded add",u);
	}
}

var run = new Run() ;

onmessage = ( evt ) => {
	if ( evt.isTrusted ) {
		//console.log("Worker gets: ",evt.data.type);
		switch (evt.data.type) {
			case "Flat":
				run.flat = new CanvasFlat(evt.data.canvas) ;
				break ;
			case "Folded":
				run.folded = new CanvasFolded(evt.data.canvas) ;
				break ;
			case "start":
				Object.assign( Settings, evt.data ) ;
				run.seq = evt.data.seq ;
				run.start() ;
				break ;
			case "continue":
				run.seq = evt.data.seq ;
				run.run(evt.data.u) ; 
				break ;
		}
	} else {
		console.log("Worker: Message not trusted");
	}
}

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
	}
	
	clear() {
		this.ctx.fillStyle = "white" ;
		this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height) ;
		this.ctx.strokeStyle = "lightgray" ;
		this.ctx.lineWidth = 1 ;
		for ( let i = 0; i <= this.Xdim ; i += .1 ) {
			// grid
			this.ctx.beginPath() ;
			this.ctx.moveTo( this.pX(i),this.pY(0) ) ;
			this.ctx.lineTo( this.pX(i),this.pY(this.Ydim) ) ;
			this.ctx.stroke() ;
		}
		for ( let i = 0; i <= this.Ydim ; i += .1 ) {
			// grid
			this.ctx.beginPath() ;
			this.ctx.moveTo( this.pX(0),this.pY(i) ) ;
			this.ctx.lineTo( this.pX(this.Xdim),this.pY(i) ) ;
			this.ctx.stroke() ;
		}
		this.ctx.fillStyle = "gray" ;
		for ( let i = .1; i <= this.Ydim ; i += .1 ) {
			this.ctx.fillText(Number(i).toFixed(2).replace(/0$/,""),this.pX(0),this.pY(i))
		}
		this.copyImg() ;
	}
	
	pX( x ) {
		return x*this.lengX/this.Xdim + this.startX ;
	} 
	
	pY( y ) {
		return (this.Ydim-y)*this.lengY/this.Ydim + this.startY ;
	}

	curve(X,Y) {
		this.pasteImg() ;
		//console.log(X,Y);

		// pass 1 in black
		this.ctx.beginPath() ;
		this.ctx.strokeStyle="black" ;
		this.ctx.lineWidth = 1 ;
		this.ctx.moveTo(this.pX(X[0]),this.pY(Y[0]));
		for ( let i = 1 ; i <= Settings.N; ++i ) {
			this.ctx.lineTo( this.pX(X[i]), this.pY(Y[i]) ) ;
		}
		this.ctx.stroke() ;

		this.copyImg() ;

		// pass 2 in red
		this.ctx.beginPath() ;
		this.ctx.strokeStyle="red";
		this.ctx.lineWidth = 4 ;
		this.ctx.moveTo(this.pX(X[0]),this.pY(Y[0]));
		for ( let i = 1 ; i <= Settings.N; ++i ) {
			this.ctx.lineTo( this.pX(X[i]), this.pY(Y[i]) ) ;
		}
		this.ctx.stroke() ;
	}
	
	add_data( u ) {
		this.curve( this.Xs( u ), u ) ;
	}
	
	copyImg () {
		this.imgData = this.ctx.getImageData(this.startX,this.startY,this.lengX,this.lengY);
	}
	
	pasteImg () {
		this.ctx.putImageData( this.imgData,this.startX,this.startY);
	}
}

class CanvasFlat extends CanvasType {
	Xs(u) {
		return [...Array(Settings.N+1).keys()].map(x =>x/(Settings.N)) ;
	}
}

class CanvasFolded extends CanvasType {
	Xs(u) {
		let sum = 0. ;
		const N1 = 1/Settings.N**2 ;
		let u0 = u[0] ;
		const X = u.slice(1).map( u1 => {
			sum += Math.sqrt(N1-(u1-u0)**2) ;
			//console.log(sum);
			u0=u1;
			return sum;
		});
		X.unshift(0);
		return X.map( x => x + (1-sum)/2 ) ; // centering
	}
}
