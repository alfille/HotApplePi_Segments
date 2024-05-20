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
var pinhole = null ;
var wire = null ;

const Settings = {
	N:		100, 	// number of segments
	population:	500, 	// Candidates/generation
	Lhat:	1.5, 	// Relative length side to (unfolded) width
	generations:	100,	// short timeline
	era:			100,		// number of generations 
} ;

class Offload {
	constructor() {
		this.seq = 0 ; // sequence to keep track of changes
		this.W = new Worker("js/GA_worker.js") ;
		this.showParameters() ;
		this.new_start = true ;
		this.u = null ;
		this.v = null ;
		this.hide() ;
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
			this.hide() ;
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
	
	show() {
		document.getElementById("threedee").hidden=false;
	}
			
	hide() {
		document.getElementById("threedee").hidden=true;
		wire=null ;
	}
	
	update_era() {
		offload.era += Settings.era ;
		offload.run() ;
	}

	download() {
		const c = new CSV() ;
		c.download(this.v,this.u);
	}

	message( evt ) {
		// called-back -- must use explicit object
		if ( evt.data.seq == offload.seq ) {
			offload.v = evt.data.volume ; // volume
			offload.volume.value = offload.v.toFixed(4) ;
			offload.more.value= offload.era_counter * Settings.generations ;
			offload.u = evt.data.u ; // segments
			// process data;
			if ( offload.era_counter >= offload.era ) {
				if ( wire == null ) {
					wire = new Wire(offload.u) ;
					offload.show() ;
				} else {
					wire.update(offload.u) ;
				}
				// this era for this current seq is done, don't send message until new Settings
				offload.more.value= `${offload.era_counter * Settings.generations} More...` ;
				offload.more.disabled=false ;
				offload.down.disabled=false ;
				return ;
			}
			offload.run() ;
		} else {
			offload.run() ;
		}		
	}
}

onload = () => {
	offload = new Offload() ;
	pinhole = new Pinhole("C3D");
	pinhole.buttons("D3D");
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

class Wire {
	constructor(seg) {
		this.rot_seg = 30 ;
		//this.L = Settings.Lhat ;
		this.L = .7 ;
		this.segnumber=seg.length-1;
		this.mode = () => this.Full3D() ;
		this.update(seg) ;
	}

	update(seg) {
		this.seg = seg ;
		this.Xs() ;
		this.mode() ;
	}

	Xs() {
		let sum = 0. ;
		const N1 = 1/this.segnumber**2 ;
		let u0 = this.seg[0] ;
		const X = this.seg.slice(1).map( u1 => {
			sum += Math.sqrt(Math.max(0,N1-(u1-u0)**2)) ;
			u0=u1;
			return sum;
		});
		X.unshift(0);
		this.X = X.map( x => x + (1-sum)/2 ) ; // centering
	}

	Full3D() {
		this.mode = () => this.Full3D() ;
		pinhole.clear();
		pinhole.scale(.7*Math.sqrt(.5+this.L));
		const reduced = Array.from( {length:this.rot_seg+1}, (_,i)=> Math.round((i*this.segnumber)/this.rot_seg)) ;
		const Cx = (x) => x-.5 ; // center x
		const Cy = (y) => this.L-y ; // Adjust for length
		const Cz = (z) => z ; // NOP
		const Jy = (y) => Cy(y)-.001 ; // just up to edge to give edge line priority 

		// top and bottom
		const top =    reduced.map( i => [ "drawLine", [ Cx(this.X[i]),  Jy(this.seg[i]),  Cz(this.seg[i]), Cx(this.X[i]), -Jy(this.seg[i]),  Cz(this.seg[i]) ] ]);
		const bottom = reduced.map( i => [ "drawLine", [ Cx(this.X[i]),  Jy(this.seg[i]), -Cz(this.seg[i]), Cx(this.X[i]), -Jy(this.seg[i]), -Cz(this.seg[i]) ] ]);
		pinhole.ops(    top.concat([["colorize",["blue"]]]) );
		pinhole.ops( bottom.concat([["colorize",["blue"]]]) );
		// sides
		const side1 =  reduced.map( i => [ "drawLine", [ Cx(this.X[i]),  Jy(this.seg[i]),  Cz(this.seg[i]), Cx(this.X[i]),  Jy(this.seg[i]), -Cz(this.seg[i]) ] ]);
		const side2 =  reduced.map( i => [ "drawLine", [ Cx(this.X[i]), -Jy(this.seg[i]),  Cz(this.seg[i]), Cx(this.X[i]), -Jy(this.seg[i]), -Cz(this.seg[i]) ] ]);
		pinhole.ops( side1.concat([["colorize",["lightblue"]]]));
		pinhole.ops( side2.concat([["colorize",["lightblue"]]]) );
		// side edge
		const end1t = this.seg.slice(1).map( (_,i) => [ "drawLine", [ Cx(this.X[i-1]),  Cy(this.seg[i-1]),  Cz(this.seg[i-1]), Cx(this.X[i]),  Cy(this.seg[i]),  Cz(this.seg[i]) ] ]);
		const end1b = this.seg.slice(1).map( (_,i) => [ "drawLine", [ Cx(this.X[i-1]),  Cy(this.seg[i-1]), -Cz(this.seg[i-1]), Cx(this.X[i]),  Cy(this.seg[i]), -Cz(this.seg[i]) ] ]);
		const end2t = this.seg.slice(1).map( (_,i) => [ "drawLine", [ Cx(this.X[i-1]), -Cy(this.seg[i-1]),  Cz(this.seg[i-1]), Cx(this.X[i]), -Cy(this.seg[i]),  Cz(this.seg[i]) ] ]);
		const end2b = this.seg.slice(1).map( (_,i) => [ "drawLine", [ Cx(this.X[i-1]), -Cy(this.seg[i-1]), -Cz(this.seg[i-1]), Cx(this.X[i]), -Cy(this.seg[i]), -Cz(this.seg[i]) ] ]);
		pinhole.ops( end1t.concat([["colorize",["red"]]]) );
		pinhole.ops( end1b.concat([["colorize",["red"]]]) );
		pinhole.ops( end2t.concat([["colorize",["red"]]]) );
		pinhole.ops( end2b.concat([["colorize",["red"]]]) );
		pinhole.turn( -5,0,3 ) ;
	}

	Quarter3D() {
		this.mode = () => this.Quarter3D() ;
		pinhole.clear();
		pinhole.scale(1.2*Math.sqrt(.5+this.L));
		const reduced = Array.from( {length:this.rot_seg+1}, (_,i)=> Math.round((i*this.segnumber)/this.rot_seg)) ;
		const Cx = (x) => x-.5 ; // center x
		const Cy = (y) => .5*this.L-y ; // Adjust for length
		const Cz = (z) => z ; // NOP
		const Jy = (y) => Cy(y)-.001 ; // just up to edge to give edge line priority 

		// just half top
		const top =    reduced.map( i => [ "drawLine", [ Cx(this.X[i]),  Jy(this.seg[i]),  Cz(this.seg[i]), Cx(this.X[i]), Jy(this.L),  Cz(this.seg[i]) ] ]);
		pinhole.ops(    top.concat([["colorize",["blue"]]]) );
		// 1 side
		const side1 =  reduced.map( i => [ "drawLine", [ Cx(this.X[i]),  Jy(this.seg[i]),  Cz(this.seg[i]), Cx(this.X[i]),  Jy(this.seg[i]), Cz(0) ] ]);
		pinhole.ops( side1.concat([["colorize",["lightblue"]]]));
		// side edge
		const end1t = this.seg.slice(1).map( (_,i) => [ "drawLine", [ Cx(this.X[i-1]),  Cy(this.seg[i-1]), Cz(this.seg[i-1]), Cx(this.X[i]),  Cy(this.seg[i]), Cz(this.seg[i]) ] ]);
		const end1b = this.seg.slice(1).map( (_,i) => [ "drawLine", [ Cx(this.X[i-1]),  Cy(this.seg[i-1]), Cz(0),             Cx(this.X[i]),  Cy(this.seg[i]), Cz(0) ] ]);
		const end2t = this.seg.slice(1).map( (_,i) => [ "drawLine", [ Cx(this.X[i-1]),  Cy(this.L),             Cz(this.seg[i-1]), Cx(this.X[i]),  Cy(this.L),           Cz(this.seg[i]) ] ]);
		const end2b = [[ "drawLine", [ Cx(this.X[0]), Cy(this.L), Cz(0), Cx(this.X[this.segnumber]), Cy(this.L), Cz(0) ] ]];
		pinhole.ops( end1t.concat([["colorize",["red"]]]) );
		pinhole.ops( end1b.concat([["colorize",["lightblue"]]]) );
		pinhole.ops( end2t.concat([["colorize",["blue"]]]) );
		pinhole.ops( end2b.concat([["colorize",["blue"]]]) );
		pinhole.turn( -2.3,0.3,0 ) ;
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
