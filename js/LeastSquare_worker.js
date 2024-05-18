// Javascript algorithm for finding closest legal sequence to a "given sequence"

// find segment lengths to solve Paul Alfille's HotApplePi problem
// Javascript E6+ code

// See https://github.com/alfille/HotApplePi

// Problem constraints:
// for N+1 segments
//   all segment lengths: 0 <= u <= Lhat
//   u[0] = u[N] = 0
//   | u[i] - u[i+1] | <= 1/N

class Candidate {
	// Single sequence
	constructor (given) {
		this.given = given ;
		this.N = given.length-1 ;
		this.NN = 1/this.N ;
		// initial guess (all zeroes)
		// note that no adjustment of endpoints is ever made so stays zero
		this.u =  Array(this.N+1).fill(0.); // Segment lengths
		this.mutate_all() ;
	}

	// initial variance
	mutate_all() {
		for ( let i = 1; i < this.N ; ++i ) {
			this.mutate_slot( i ) ;
		}
	}
	
	mutate_one() {
		// mutate one random slot
		this.mutate_slot( 1+ Math.floor(Math.random()*(this.N-1))) ;
	}
	
	mutate_slot( i ) {
		// vary (legally) one point
		const min = Math.max( 0, this.u[i-1]-this.NN, this.u[i+1]-this.NN ) ;
		const max = Math.min(    this.u[i-1]+this.NN, this.u[i+1]+this.NN ) ;
		this.u[i] = Math.random() * ( max-min ) + min ;
	}
	
	gradient() {
		// Alter all values to increase return, each in turn (low to high)
		for ( let s = 1; s < this.N ; ++s ) {
			this.improve_slot(s) ;
		}
	}
	
	gradient_r() {
		// Alter all values to increase return, each in turn (high to low)
		for ( let s = this.N-1; s >0 ; --s ) {
			this.improve_slot_r(s) ;
		}
	}
	
	improve_slot(s) {
		// test changing current value to either max possible, min possible, or randoms
		// choose best
		const min = Math.max(             0, this.u[s-1]-this.NN, this.u[s+1]-this.NN ) ;
		const max = Math.min( this.u[s-1]+this.NN, this.u[s+1]+this.NN ) ;
		
		const v0 = this.adjust_rest(s,this.u[s]) ; // reference value
		
		if ( this.adjust_rest( s, max ) < v0 ) {
			this.u[s] = max ;
		} else if ( this.adjust_rest( s, min ) < v0 ) {
			this.u[s] = min ;
		} else {
			const r0 = Math.random() * (max-min) + min ;
			const r1 = Math.random() * (max-min) + min ;
			if ( this.adjust_rest( s, r0 ) < v0 ) {
				this.u[s] = r0 ;
			} else if ( this.adjust_rest( s, r1 ) < v0 ) {
				this.u[s] = r1 ;
			}
		}
	}		

	adjust_rest(s,u) {
		// let value at s be u, make sure rest (going higher) are legal and calculate sum of squares
		let u_old = u[s-1] ;
		let u_current = u ;
		let sum = 0 ;
		for ( let ss = s ; ss < this.N, ++ss ) {
			const min = Math.max( 0, u_old-this.NN, this.u[ss+1]-this.NN ) ;
			const max = Math.min(    u_old+this.NN, this.u[ss+1]+this.NN ) ;
			if ( u_current < min ) {
				u_current = min ;
			} else if ( u_current > max ) {
				u_current = max ;
			}
			sum += (u_current-this.given[ss])**2;
			u_old = u_current ;
			u_current = this.u[ss+1];
		}
		return sum ;
	}
			
	improve_slot_r(s) {
		// test changing current value to either max possible, min possible, or randoms
		// choose best
		const min = Math.max( 0, this.u[s-1]-this.NN, this.u[s+1]-this.NN ) ;
		const max = Math.min(    this.u[s-1]+this.NN, this.u[s+1]+this.NN ) ;
		
		const v0 = this.adjust_rest_r(s,this.u[s]) ; // reference value
		
		if ( this.adjust_rest_r( s, max ) < v0 ) {
			this.u[s] = max ;
		} else if ( this.adjust_rest_r( s, min ) < v0 ) {
			this.u[s] = min ;
		} else {
			const r0 = Math.random() * (max-min) + min ;
			const r1 = Math.random() * (max-min) + min ;
			if ( this.adjust_rest_r( s, r0 ) < v0 ) {
				this.u[s] = r0 ;
			} else if ( this.adjust_rest_r( s, r1 ) < v0 ) {
				this.u[s] = r1 ;
			}
		}
	}		

	adjust_rest_r(s,u) {
		// let value at s be u, make sure rest (going higher) are legal and calculate sum of squares
		let u_old = u[s+1] ;
		let u_current = u ;
		let sum = 0 ;
		for ( let ss = s ; ss >0, --ss ) {
			const min = Math.max( 0, u_old-this.NN, this.u[ss-1]-this.NN ) ;
			const max = Math.min(    u_old+this.NN, this.u[ss-1]+this.NN ) ;
			if ( u_current < min ) {
				u_current = min ;
			} else if ( u_current > max ) {
				u_current = max ;
			}
			sum += (u_current-this.given[ss])**2;
			u_old = u_current ;
			u_current = this.u[ss-1];
		}
		return sum ;
	}
			
	profile() {
		// best profile
		return this.u ;
	}
}		 

class Run {
	constructor () {
		this.seq = 0 ;
		this.candidate = null ;
	}
	
	start(given) {
		this.candidate = new Candidate(given) ;
		++this.seq ;
	}
	
	run() {
		// send message back
		//console.log("Worker:Send message",Settings.N);
		for ( let p = 0 ; p<1000 ; ++p ) {
			this.candidate.mutate_one() ;
			this.candidate.gradient();
			this.candidate.gradient_r();
		}
		// send note back to master
		postMessage( {seq:this.seq, data:this.pop.profile() } ) ;
	}
}

var run = new Run() ;

onmessage = ( evt ) => {
	if ( evt.isTrusted ) {
		//console.log("Worker gets: ",evt.data.type);
		run.start( evt.data.given ) ;
		run.run();
	} else {
		console.log("Worker: Message not trusted");
	}
}
