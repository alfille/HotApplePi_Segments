// Javascript genetic algorithm for solving best volume

// find segment lengths to solve Paul Alfille's HotApplePi problem
// Javascript E6+ code

// See https://github.com/alfille/HotApplePi

// Problem constraints:
// for N+1 segments
//   all segment lengths: 0 <= u <= Lhat
//   u[0] = u[N] = 0
//   | u[i] - u[i+1] | <= 1/N

var offload = null ;
var cookie = null ;

const Settings = {
	N:		100, 	// number of segments
	population:	1, 	// Candidates/generation
	Lhat:	.5, 	// Relative length side to (unfolded) width
	generations:	50,	// short timeline
	era:			100,		// number of generations 
} ;

class Offload {
	constructor() {
		this.seq = 0 ; // sequence to keep track of changes
		this.W = new Worker("js/Gradient_worker.js") ;
		this.showParameters() ;
		this.new_start = true ;
		this.W.addEventListener("message", this.message, false ) ;
		this.more = document.getElementById("More") ;
		this.volume = document.getElementById("Volume") ;
		this.P = new Worker("Plotter.js") ; // subworker
		[ "Flat", "Folded" ] .forEach( f => {
			const c = new WorkerCanvas( f ) ;
			c.send(this.W) ;
		});
	}
	
	showParameters() {
		Object.entries(Settings).forEach( e => {
			const id = document.getElementById( e[0] ) ;
			if ( id !== null ) {
				id.value = e[1] ;
			}
		});
	}
	
	getParameters() {
		Object.entries(Settings).forEach( e => {
			const id = document.getElementById( e[0] ) ;
			if ( id !== null ) {
				Settings[e[0]] = Number(id.value) ;
			}
		});
		this.new_start = true ;
		this.run() ;
	}
		
	run() {
		this.more.disabled=true ;
		this.more.disabled=true ;
		if ( this.new_start ) {
			this.volume.value=Number(0).toFixed(4) ;
			this.seq += 1 ;
			this.era_counter = 0 ;
			this.W.postMessage(Object.assign(Object.assign({},Settings),{type:"start",  seq:this.seq})) ;
			this.new_start = false ;
			this.era = Settings.era ;
		} else {
			this.era_counter += 1 ;
			this.W.postMessage(Object.assign(Object.assign({},Settings),{type:"continue", seq:this.seq})) ;
		}
	}
	
	update_era() {
		offload.era += Settings.era ;
		offload.run() ;
	}
	
	message( evt ) {
		// called-back -- must use explicit object
		//console.log( "Window", evt, evt.data.seq );
		if ( evt.data.seq == offload.seq ) {
			offload.volume.value = evt.data.volume.toFixed(4) ;
			offload.more.value= offload.era_counter * Settings.generations ;
			// process data;
			if ( offload.era_counter >= offload.era ) {
				// this era for this current seq is done, don't send message until new Settings
				offload.more.value= `${offload.era_counter * Settings.generations} More...` ;
				offload.more.disabled=false ;
				return ;
			}
		}
		
		offload.run() ;
	}
}

onload = () => {
	offload = new Offload() ;
	//console.log("new offload");
	offload.run() ;
}

class WorkerCanvas {
	constructor(name) {
		this.name = name ;
		this.canvas = document.getElementById(name) ;
		this.transferCanvas = this.canvas.transferControlToOffscreen() ;
	}
	
	send(W) {
		W.postMessage({ canvas: this.transferCanvas, type:this.name},[this.transferCanvas]);
	}
}
