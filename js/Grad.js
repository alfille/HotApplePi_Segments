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
		this.down = document.getElementById("Download") ;
		this.volume = document.getElementById("Volume") ;
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
		this.down.disabled=true ;
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
	
	download() {
		this.W.postMessage({type:"download",seq:this.seq});
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
				offload.down.disabled=false ;
				return ;
			}
			offload.run() ;
		} else if ( evt.data.seq == -1 ) {
			console.log(evt.data.volume,evt.data.u) ;
			const c = new CSV() ;
			c.download(evt.data.volume,evt.data.u) ;
		} else {
			offload.run() ;
		}		
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

class CSV {
	// create a CSV file with data and parameters

	constructor() {
	}

	Xs() {
		let sum = 0. ;
		const N1 = 1/Settings.N**2 ;
		let u0 = this.u[0] ;
		const X = this.u.slice(1).map( u1 => {
			sum += Math.sqrt(N1-(u1-u0)**2) ;
			//console.log(sum);
			u0=u1;
			return sum;
		});
		X.unshift(0);
		return X.map( x => x + (1-sum)/2 ) ; // centering
	}
	
	Ss() {
		return [...Array(Settings.N+1).keys()].map(x =>x/(Settings.N)) ;
	}

	format_line(arr) {
		return arr.map(a => typeof(a)=="number" ? Number(a) : `"${a}"`).join(',') + '\n' ;
	}
	
	parameters(i) {
		switch(i) {
			case 0:
				return ['','Algorithm','gradient'] ;
			case 1:
				return ['','Length',Settings.Lhat] ;
			case 2:
				return ['','Volume',this.volume] ;
			case 3:
				return ['','Segments',Settings.N] ;
			default:
				return [] ;
		}
	}

    blob(blub) {
        //htype the file type i.e. text/csv
        const link = document.createElement("a");
        link.download = `Solution_${Settings.Lhat}.csv`;
        link.href = window.URL.createObjectURL(blub);
        link.style.display = "none";

        document.body.appendChild(link);
        link.click(); // press invisible button
        
        // clean up
        // Add "delay" see: https://www.stefanjudis.com/snippets/how-trigger-file-downloads-with-javascript/
        setTimeout( () => {
            window.URL.revokeObjectURL(link.href) ;
            document.body.removeChild(link) ;
        });
    }
			
	download(volume,u) {
		this.volume = volume ;
		this.u = u ;
		let x = this.Xs() ;
		let s = this.Ss() ;
		let csv = this.format_line(["s","x","f(s)","","Parameter","Value"]) +
			u.map( (_,i) => this.format_line( [s[i],x[i],u[i]].concat(this.parameters(i)) ) ).join('');
		const blub = new Blob([csv], {type: 'text/csv'});
		this.blob( blub ) ;
	}
}
