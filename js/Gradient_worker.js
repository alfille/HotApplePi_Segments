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

class Candidate {
	// Single sequence
	constructor () {
		this.u =  Array(Settings.N+1).fill(0.); // Segment lengths
		this.mutate_all() ;
	}

	mutate_all() {
		for ( let i = 1; i < Settings.N ; ++i ) {
			this.mutate_slot( i ) ;
		}
	}
	
	mutate_slot( i ) {
		const NN = 1/Settings.N ;
		const min = Math.max(             0, this.u[i-1]-NN, this.u[i+1]-NN ) ;
		const max = Math.min( Settings.Lhat, this.u[i-1]+NN, this.u[i+1]+NN ) ;
		this.u[i] = Math.random() * ( max-min ) + min ;
	}
	
	gradient() {
		// Alter all values to increase return, each in turn
		for ( let s = 1; s < Settings.N ; ++s ) {
			this.improve_slot(s) ;
		}
	}
	
	improve_slot(s) {
		// test changing current value to either max possible, min possible, or randoms
		const NN = 1/Settings.N ;
		const min = Math.max(             0, this.u[s-1]-NN, this.u[s+1]-NN ) ;
		const max = Math.min( Settings.Lhat, this.u[s-1]+NN, this.u[s+1]+NN ) ;
		
		const v0 = this.two_slots(s,this.u[s]) ; // reference value
		
		if ( this.two_slots( s, max ) > v0 ) {
			this.u[s] = max ;
		} else if ( this.two_slots( s, min ) > v0 ) {
			this.u[s] = min ;
		} else {
			const r0 = Math.random() * (max-min) + min ;
			const r1 = Math.random() * (max-min) + min ;
			if ( this.two_slots( s, r0 ) > v0 ) {
				this.u[s] = r0 ;
			} else if ( this.two_slots( s, r1 ) > v0 ) {
				this.u[s] = r1 ;
			}
		}
	}
		
	valuate() {
		let val_E = 0. ;
		let val_L = 0. ;
		const N2 = Settings.N**2 ;
		let u0 = 0  ;
		this.u.slice(1).forEach( u1 => {
			const sq = Math.sqrt( 1 - N2*(u1-u0)**2 ) ;
			val_E += sq*(u0**2+u0*u1+u1**2) ;
			val_L += sq*(u0+u1) ;
			u0 = u1 ;
		});
		return ( 3 * Settings.Lhat * val_L  - 2 * val_E ) / ( 6 * Settings.N ) ;
	}

	slot_val(u0,u1) {
		// ignores constant multipliers
		return ( 3 * (u0+u1) * Settings.Lhat - 2 * ( u1**2 + u0**2 + u0*u1 ) ) * Math.sqrt( 1 - ( (u1-u0)*Settings.N )**2 ) ;
	}
	
	two_slots(s,trial_u) {
		return this.slot_val( this.u[s-1], trial_u ) + this.slot_val( trial_u, this.u[s+1] ) ;
	}
}		 



class Generation {
	// Holds a list of candidates and manages population selection
	constructor () {
		this.population=[new Candidate()];
	}
	
	volume() {
		return 4 * this.population[0].valuate() ;
	}
	
	profile() {
		// best profile
		return this.population[0].u ;
	}
	
	mutate() {
		this.population[0].gradient() ;
	}		

}

class Run {
	constructor () {
		this.gen = null ;
		this.W = new Worker("Plotter.js") ; // subworker
	}
	
	start() {
		this.gen = new Generation() ;
	}
	
	run() {
		// send message back
		//console.log("Worker:Send message",Settings.N);
		for ( let g = 0 ; g<Settings.generations ; ++g ) {
			this.gen.mutate() ;
		}
		// send note back to master
		postMessage( {volume:this.gen.volume(), seq:this.seq } ) ;
		// send data to plotter
		this.W.postMessage({seq:this.seq,type:"continue",u:this.gen.profile()});
	}
}

var run = new Run() ;

onmessage = ( evt ) => {
	if ( evt.isTrusted ) {
		//console.log("Worker gets: ",evt.data.type);
		switch (evt.data.type) {
			case "Flat":
			case "Folded":
				run.W.postMessage({canvas:evt.data.canvas,type:evt.data.type},[evt.data.canvas]) ;
				break ;
			case "download":
				// get data
				postMessage({seq:-1,volume:run.gen.volume(),u:run.gen.profile()});
				break ;
			case "start":
				Object.assign( Settings, evt.data ) ;
				run.W.postMessage(evt.data);
				run.seq = evt.data.seq ;
				run.start() ;
				run.run() ;
				break ;
			case "continue":
				//console.log("continue");
				Object.assign( Settings, evt.data ) ;
				run.seq = evt.data.seq ;
				run.run() ; 
				break ;
		}
	} else {
		console.log("Worker: Message not trusted");
	}
}

class CanvasType {
	constructor(canvas) {
		this.canvas = canvas ;
		this.ctx=this.canvas.getContext("2d",{willReadFrequently:true,});
		this.startX = 10 ;
		this.startY = 10 ;
		this.lengX = this.canvas.width - 2* this.startX ;
		this.lengY = this.canvas.height - 2* this.startY ;
		this.ctx.globalAlpha = 1.0 ;
	}
	
	clear() {
		this.ctx.fillStyle = "white" ;
		this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height) ;
		this.ctx.strokeStyle = "lightgray" ;
		this.ctx.lineWidth = 1 ;
		for ( let i = 0; i <= 1 ; i += .1 ) {
			// grid
			this.ctx.beginPath() ;
			this.ctx.moveTo( this.pX(0),this.pY(i) ) ;
			this.ctx.lineTo( this.pX(1),this.pY(i) ) ;
			this.ctx.stroke() ;
			this.ctx.beginPath() ;
			this.ctx.moveTo( this.pX(i),this.pY(0) ) ;
			this.ctx.lineTo( this.pX(i),this.pY(1) ) ;
			this.ctx.stroke() ;
		}
		this.copyImg() ;
	}
	
	pX( x ) {
		return x*this.lengX + this.startX ;
	} 
	
	pY( y ) {
		return (1-y)*this.lengY + this.startY ;
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
			u0=u1;
			return sum;
		});
		X.unshift(0);
		return X.map( x => x + (1-sum)/2 ) ; // centering
	}
}
