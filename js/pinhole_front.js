// https://github.com/tidwall/pinhole-js
//
// Copyright 2023 Joshua J Baker. All rights reserved.
// Use of this source code is governed by an MIT-style
// license that can be found in the LICENSE file.

class Pinhole {
	constructor(canvas_id) {
		this.W = new Worker("js/pinhole_worker.js");
		const canvas = document.getElementById(canvas_id).transferControlToOffscreen();
		// No response messages anticipated
		//this.W.addEventListener("message", this.message, false ) ;
		this.W.postMessage({canvas:canvas,type:"new",},[canvas]) ;
	}
	
	button(lab, func ) {
		const b = document.createElement('button');
		b.innerHTML = lab ;
		b.style.height="2em";
		b.addEventListener( 'click', () =>func() ) ;
		return b ;
	}
	
	buttons(div_id) {
		const d = document.getElementById( div_id ) ;
		//d.style.flexDirection="row";
		d.display="flex";
		[
			this.button( "<B>&#8592;</B>", () => this.rot(  0,1,0, this.W ) ),
			this.button( "<B>&#8595;</B>", () => this.rot( -1,0,0, this.W ) ),
			this.button( "&#8630;",        () => this.rot(  0,0,1, this.W ) ),
			this.button( "<B>X</B>",       () => this.stop(        this.W ) ),
			this.button( "&#8631;",        () => this.rot( 0,0,-1, this.W ) ),
			this.button( "<B>&#8593;</B>", () => this.rot(  1,0,0, this.W ) ),
			this.button( "<B>&#8594;</B>", () => this.rot( 0,-1,0, this.W ) ),
		].forEach( b => d.appendChild(b) ) ;
	}

	rot( x,y,z, W ) {
		// continuous rotation
		W.postMessage( {type:"rotate", value:[x,y,z]} ) ;
	}
	
	turn( x,y,z  ) {
		// global (1-time) rotation
		this.W.postMessage( {type:"turn", value:[x,y,z]} ) ;
	}
	
	scale( s ) {
		// global scale
		this.W.postMessage( {type:"scale", value:s, } );
	}
	
	stop( W ) {
		// stop rotations
		W.postMessage( {type:"stop",} ) ;
	}
	
	ops( oplist ) {
		// send list of design elements
		this.W.postMessage( { type:"ops", value: oplist, } ) ;
	}
	
	clear() {
		// clear the screen and design
		this.W.postMessage( { type:"clear", } ) ;
	}
}
