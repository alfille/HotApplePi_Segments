// Javascript genetic algorithm for solving best volume

// find segment lengths to solve Paul Alfille's HotApplePi problem
// Javascript E6+ code

// See https://github.com/alfille/HotApplePi

// Problem constraints:
// for N+1 segments
//   all segment lengths: 0 <= u <= Lhat
//   u[0] = u[N] = 0
//   | u[i] - u[i+1] | <= 1/N

var design = null ;

class InputFile {
	constructor() {
		this.Width = 1.;
		this.Points = null;
		this.Mirror = false;
		this.table = new Array() ;
		this.tableview="TVall";
	}

	Click() {
		document.getElementById("CSVup").click() ;
	}
	
	Upload() {
		const CVSup = document.getElementById("CSVup");
		if ( CSVup.files.length > 0 ) {
			console.log(CSVup.files[0]);
			const reader = new FileReader() ;
			reader.onload = e => this.CSVparse(e.target.result) ;
			document.getElementById("Getfile").hidden=true;
			document.getElementById("filename").innerText=CSVup.files[0].name;				
			document.getElementById("Regetfile").hidden=false;
			reader.readAsText(CSVup.files[0]);
		}
	}
	
	CSVparse( raw ) {
		const lines = raw.split(/\n|\r\n/);
		lines.forEach( (l,i) =>
			this.table[i] = l.
			split(/,| /).
			map( e => isNaN( e ) ? e : parseFloat(e) )
			);
		this.TableStats() ;
	}
	
	TableStats() {
		this.maxlength = this.table.reduce( (a,b) => Math.max(a,b.length), 0);
		this.collength= new Array( this.maxlength ).fill(0);
		this.table.forEach( t => t.forEach( (e,i) => this.collength[i] += isNaN(e) ? 0 : 1 ) );
		this.showTable() ;
	}
	
	Transpose() {
		const pivot = new Array(this.maxlength).fill(null) ;
		this.table.forEach( (t,i) =>
			t.forEach( (e,j)=> {
				if ( pivot[j]==null ) {
					pivot[j] = new Array() ;
				}
				pivot[j][i] = e;
			})
			);
		this.table = pivot ;
		this.TableStats() ;
	}
	
	tableView(target) {
		if ( this.tableview != target.id ) {
			this.tableview = target.id;
			this.showTable() ;
		}
	}
			
	showTable() {
		document.getElementById(this.tableview).checked=true;
		const tab = document.getElementById("datatable");
		tab.innerHTML="" ;
		tab.style.borderCollapse="collapse";
		const head = document.createElement("thead");
		const hr = document.createElement("tr");
		const change='onChange="objectInputFile.Check(this)"';
		const ftitle='title="Make this column the end tab height -- f(s)"';
		const stitle='title="Make this column the unfolded <s> dimension -- optional"';
		this.table[0].forEach( (_,i) => {
			const h = document.createElement("th");
			h.innerHTML=`<label><input type="checkbox" id="f,${i}" ${change} ${ftitle}>f</label> <label><input type="checkbox" id="s,${i}" ${change} ${stitle}>s</label>`;
			h.style.border="2px solid blue";
			h.style.textAlign="left";
            hr.appendChild(h);
		});
		head.appendChild(hr);
		tab.appendChild(head);			
		const body = document.createElement("tbody");
		if ( this.tableview != "TVnone" ) {
			this.table.slice(0,(this.tableview=="TVshort")?8:500).forEach( t => {
				const r = document.createElement("tr");
				t.forEach( e => {
					const d = document.createElement("td");
					d.appendChild( document.createTextNode( e ) );
					d.style.border="1px solid blue";
					r.appendChild( d ) ;
				}) ;
				body.appendChild( r ) ;
			}) ;
		}
		tab.appendChild( body ) ;
		document.getElementById("Table").hidden=false;
		this.check_f=new Array();
		this.check_s=new Array();
		this.table[0].forEach( (_,i) => {
			this.check_f[i] = document.getElementById(`f,${i}`);
			this.check_s[i] = document.getElementById(`s,${i}`);
		});
		this.check_f[0].click();
	}
	
	Check(target) {
		const [fs,i]=target.id.split(",");
		if ( fs=="f" ) {
			if (this.check_f[i].checked) {
				this.check_f.forEach( (f,j) => f.checked=(i==j) );
				this.check_s[i].checked=false;
			} else {
				this.check_f[0].click() ;
			}
		} else {
			if (this.check_s[i].checked) {
				this.check_s.forEach( (s,j) => s.checked=(i==j) );
				if ( this.check_f[i].checked ) {
					this.check_s[i].checked=false;
				}
			}
		}
		this.f_col=this.check_f.findIndex( f=>f.checked ) ;
		this.s_col=this.check_s.findIndex( s=>s.checked ) ;
		if ( this.s_col[0] != 0. ) {
			// add initial zero
			this.s_col.unshift( 0. ) ;
			this.f_col.unshift( 0. ) ;
		}
		console.log(this.f_col,this.s_col);
	}
	
	EqualDivvy(len) {
		return Array.from( {length: len}, (_,i)=>i/(len-1) );
	}
	
	Condition() {
		const F=this.table.map(t=>t[this.f_col]).filter( (e)=>! isNaN(e)	) ;
		
		if (F.length < 4) {
			console.error("F array too few values");
			return null;
		}
		if ( this.s_col<0 ) {
			console.log("No S column given. Using default spacing");
			return {F:F,S:this.EqualDivvy( F.length )};
		}

		const S=this.table.map(t=>t[this.s_col]).filter( (e)=> !isNaN(e) );
		if ( S.length != F.length ) {
			console.log("S column length differs. Using default spacing");
			return {F:F,S:this.EqualDivvy( F.length )};
		}
		const Sort=S.map( (s,i)=>({F:F[i],S:s}) ).sort( (a,b)=>a.S-b.S );
		if ( Sort.slice(1).some( (sort,i)=>Sort[i].S==sort.S ) ) {
			console.log("Duplicate S values. Using default spacing");
			return {F:F,S:this.EqualDivvy( F.length )};
		}
		// Shift S to 0->1 and scale F
		const start = Sort[0].S;
		const end = Sort[Sort.length-1].S ;
		return {
			F: Sort.map( sort => sort.F/(end-start) ),
			S: Sort.map( sort => (sort.S-start)/(end-start) )
		};
	}			
}

var objectInputFile = new InputFile() ;

class Graph {
	constructor(name) {
		this.canvas = document.getElementById(name);
		this.Xleng = this.canvas.width - 20 ;
		this.Yleng = this.canvas.height - 20 ;
		this.ctx = this.canvas.getContext("2d") ;
		this.Xend=this.screenX(1);
		this.Yend=this.screenY(0);
	}

	screenX(x) {
		// point to screen
		return 10+x*this.Xleng;
	}
	
	screenY(y) {
		// point to screen
		return 10+(1-2*y)*this.Yleng;
	}
	
	pX(x) {
		// screen to point
		return (x-10)/this.Xleng ;
	}
	
	pY(y) {
		// screen to point
		return .5+.5*((10-y)/this.Yleng);
	}
	
	grid() {
		this.ctx.fillStyle = "lightgray" ;
		this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height) ;
		this.ctx.strokeStyle = "white" ;
		this.ctx.lineWidth = 1 ;
		for ( let i = 0; i <= 1 ; i += .1 ) {
			// grid
			this.ctx.beginPath() ;
			this.ctx.moveTo( this.screenX(i),this.screenY(0) ) ;
			this.ctx.lineTo( this.screenX(i),this.screenY(.5) ) ;
			this.ctx.stroke() ;
		}
		for ( let i = 0; i <= .5 ; i += .1 ) {
			// grid
			this.ctx.beginPath() ;
			this.ctx.moveTo( this.screenX(0),this.screenY(i) ) ;
			this.ctx.lineTo( this.screenX(1),this.screenY(i) ) ;
			this.ctx.stroke() ;
		}
		this.ctx.fillStyle = "black" ;
		for ( let i = .1; i <= .5 ; i += .1 ) {
			this.ctx.fillText(Number(i).toFixed(2).replace(/0$/,""),this.screenX(0),this.screenY(i))
		}
	}
	
}

class Raw extends Graph {
	constructor() {
		super("Raw");
		this.segnumber = 200 ;
		this.canvas.addEventListener("mousedown", e => {
			this.active = true;
			this.new_point( e.offsetX, e.offsetY ) ;
		});
		this.canvas.addEventListener("mousemove", e => {
			if ( this.active ) {
				this.new_point( e.offsetX, e.offsetY ) ;
			}
		});
		this.canvas.addEventListener("mouseup", e=> {
			this.active = false ;
			this.new_point( e.offsetX, e.offsetY ) ;
		});
		this.clear();
	}

	clear() {
		this.hide();
		this.grid();
		this.ctx.strokeStyle="black";
		const x=this.screenX(0);
		const y=this.screenY(0);
		this.ctx.beginPath() ;
		this.ctx.moveTo(x,y);
		const a = .5*(this.Xend-this.Yend-x+y);
		this.ctx.lineTo(x+a,y-a);
		this.ctx.lineTo(this.Xend,this.Yend);
		this.ctx.lineTo(this.Yend+x-y,this.Yend);
		this.ctx.closePath() ;
		this.ctx.fillStyle="white";
		this.ctx.fill();
		this.endTab = new Path2D() ;
		this.endTab.moveTo(x,y);
		this.active = false ;
	}
	
	show() {
		document.getElementById("FoldDiv").hidden=false;
		this.folded=new Folded(this.seg) ;
		document.getElementById("Download").removeAttribute("disabled");
		document.getElementById("threedee").hidden=false;
	}
			
	hide() {
		document.getElementById("threedee").hidden=true;
		document.getElementById("FoldDiv").hidden=true;
		document.getElementById("Download").setAttribute("disabled",true);
		this.folded=null ;
	}
			
	new_point(x,y) {
		if ( this.ctx.isPointInPath( x, y ) ) {
			this.ctx.fillStyle="lightgray";
			this.ctx.fill();
			this.ctx.beginPath();
			this.ctx.moveTo(x,y);
			const a = .5*(this.Xend-this.Yend-x+y);
			this.ctx.lineTo(x+a,y-a);
			this.ctx.lineTo(this.Xend,this.Yend);
			this.ctx.lineTo(this.Yend+x-y,this.Yend);
			this.ctx.closePath() ;
			this.ctx.fillStyle="white";
			this.ctx.fill();
			this.endTab.lineTo(x,y)
			this.ctx.stroke(this.endTab);
			if ( Math.abs(this.Xend-this.Yend-x+y)<=1 ) {
				this.end_point();
			}
		}
	}
	
	finish() {
		this.ctx.fillStyle="lightgray";
		this.ctx.fill();
		this.end_point() ;
	}
	
	end_point() {
		this.endTab.lineTo(this.Xend,this.Yend);
		this.endTab.closePath();
		this.ctx.stroke(this.endTab);
		this.ctx.fillStyle="blue";
		this.ctx.fill(this.endTab);
		// Make segments
		this.seg=[] ;
		this.ctx.strokeStyle="yellow";
		for ( let i=0 ; i<=this.segnumber ; i+=1 ) {
			const x = this.screenX(i/this.segnumber) ;
			let y = this.Yend/2 ;
			let diff = y ;
			while ( diff > .001 ) {
				diff *= .5 ;
				if ( this.ctx.isPointInPath( this.endTab, x, y ) ) {
					y -= diff ;
				} else {
					y += diff ;
				}
			}
			this.seg[i]=this.pY(y);
			this.ctx.beginPath();
			this.ctx.moveTo(x,this.Yend);
			this.ctx.lineTo(x,y);
			this.ctx.stroke();
		}
		this.seg[0] = 0 ;
		this.seg[this.segnumber] = 0 ;
		this.show();
	}
	
	download() {
		if ( this.folded ) {
			this.folded.download() ;
		}
	}
}

class Fixed extends Graph {
	constructor(seg) {
		super("Fixed");
		this.rot_seg = 30 ;
		this.L = .6 ; // half length
		this.seg = seg;
		this.segnumber=seg.length-1;
		this.clear();
		this.Xs() ;
		this.plot(); // folded plot
		this.Full3D() ;
	}

	clear() {
		this.grid();
	}
	
	plot() {
		this.ctx.strokeStyle="red";
		this.ctx.lineWidth=2;
		this.ctx.fillStyle="blue";
		this.ctx.beginPath();
		this.ctx.moveTo(this.screenX(this.X[0]),this.screenY(this.seg[0]));
		this.X.slice(1).forEach( (x,i) => this.ctx.lineTo(this.screenX(x),this.screenY(this.seg[i])) );
		this.ctx.stroke();
		this.ctx.closePath();
		this.ctx.fill();
	}
	
	Xs() {
		let sum = 0. ;
		const N1 = 1/this.segnumber**2 ;
		let u0 = this.seg[0] ;
		const X = this.seg.slice(1).map( u1 => {
			sum += Math.sqrt(Math.max(0,N1-(u1-u0)**2)) ;
			//console.log(sum);
			u0=u1;
			return sum;
		});
		X.unshift(0);
		this.X = X.map( x => x + (1-sum)/2 ) ; // centering
	}

	format_line(arr) {
		return arr.map(a => typeof(a)=="number" ? Number(a) : `"${a}"`).join(',') + '\n' ;
	}
	
    blob(blub) {
        //htype the file type i.e. text/csv
        const link = document.createElement("a");
        link.download = `Designed.csv`;
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
			
	download() {
		let x = this.Xs(this.seg) ;
		let csv = this.format_line(["s","x","f(s)"]) +
			this.seg.map( (u,i) => this.format_line( [ i/this.segnumber,x[i],u ] ) ).join('');
		const blub = new Blob([csv], {type: 'text/csv'});
		this.blob( blub ) ;
	}
	
	Full3D() {
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
class Folded extends Graph {
	constructor(seg) {
		super("Folded");
		this.rot_seg = 30 ;
		this.L = .6 ; // half length
		this.seg = seg;
		this.segnumber=seg.length-1;
		this.clear();
		this.Xs() ;
		this.plot(); // folded plot
		this.Full3D() ;
	}

	clear() {
		this.grid();
	}
	
	plot() {
		this.ctx.strokeStyle="red";
		this.ctx.lineWidth=2;
		this.ctx.fillStyle="blue";
		this.ctx.beginPath();
		this.ctx.moveTo(this.screenX(this.X[0]),this.screenY(this.seg[0]));
		this.X.slice(1).forEach( (x,i) => this.ctx.lineTo(this.screenX(x),this.screenY(this.seg[i])) );
		this.ctx.stroke();
		this.ctx.closePath();
		this.ctx.fill();
	}
	
	Xs() {
		let sum = 0. ;
		const N1 = 1/this.segnumber**2 ;
		let u0 = this.seg[0] ;
		const X = this.seg.slice(1).map( u1 => {
			sum += Math.sqrt(Math.max(0,N1-(u1-u0)**2)) ;
			//console.log(sum);
			u0=u1;
			return sum;
		});
		X.unshift(0);
		this.X = X.map( x => x + (1-sum)/2 ) ; // centering
	}

	format_line(arr) {
		return arr.map(a => typeof(a)=="number" ? Number(a) : `"${a}"`).join(',') + '\n' ;
	}
	
    blob(blub) {
        //htype the file type i.e. text/csv
        const link = document.createElement("a");
        link.download = `Designed.csv`;
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
			
	download() {
		let x = this.Xs(this.seg) ;
		let csv = this.format_line(["s","x","f(s)"]) +
			this.seg.map( (u,i) => this.format_line( [ i/this.segnumber,x[i],u ] ) ).join('');
		const blub = new Blob([csv], {type: 'text/csv'});
		this.blob( blub ) ;
	}
	
	Full3D() {
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


onload = () => {
	design = new Raw() ;
	pinhole = new Pinhole("C3D");
	pinhole.buttons("D3D");
}

class Offload {
	constructor() {
		this.seq = 0 ; // sequence to keep track of changes
		this.W = new Worker("js/Spreadsheet_worker.js") ;
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

class WorkerCanvasWorkerCanvas {
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
