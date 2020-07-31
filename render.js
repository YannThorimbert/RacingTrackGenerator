

// import { OrbitControls } from 'https://unpkg.com/three@<VERSION>/examples/jsm/controls/OrbitControls.js';
// import * as THREE from 'https://unpkg.com/three';


console.log("ENTER RENDER")

var camera, scene, renderer,
geometry, mesh, light, stats, controls;

function trim (str) {
    str = str.replace(/^\s+/, '');
    for (var i = str.length - 1; i >= 0; i--) {
        if (/\S/.test(str.charAt(i))) {
            str = str.substring(0, i + 1);
            break;
        }
    }
    return str;
}



var parseStl = function(stl) {
    var state = '';
    var lines = stl.split('\n');
    var geo = new THREE.Geometry();
    var name, parts, line, normal, done, vertices = [];
    var vCount = 0;
    stl = null;

    for (var len = lines.length, i = 0; i < len; i++) {
        if (done) {
            break;
        }
        line = trim(lines[i]);
        parts = line.split(' ');
        switch (state) {
            case '':
                if (parts[0] !== 'solid') {
                    console.error(line);
                    console.error('Invalid state "' + parts[0] + '", should be "solid"');
                    return;
                } else {
                    name = parts[1];
                    state = 'solid';
                }
                break;
            case 'solid':
                if (parts[0] !== 'facet' || parts[1] !== 'normal') {
                    console.error(line);
                    console.error('Invalid state "' + parts[0] + '", should be "facet normal"');
                    return;
                } else {
                    normal = [
                        parseFloat(parts[2]),
                        parseFloat(parts[3]),
                        parseFloat(parts[4])
                    ];
                    state = 'facet normal';
                }
                break;
            case 'facet normal':
                if (parts[0] !== 'outer' || parts[1] !== 'loop') {
                    console.error(line);
                    console.error('Invalid state "' + parts[0] + '", should be "outer loop"');
                    return;
                } else {
                    state = 'vertex';
                }
                break;
            case 'vertex':
                if (parts[0] === 'vertex') {
                    geo.vertices.push(new THREE.Vector3(
                        parseFloat(parts[1]),
                        parseFloat(parts[2]),
                        parseFloat(parts[3])
                    ));
                } else if (parts[0] === 'endloop') {
                    geo.faces.push( new THREE.Face3( vCount*3, vCount*3+1, vCount*3+2, new THREE.Vector3(normal[0], normal[1], normal[2]) ) );
                    vCount++;
                    state = 'endloop';
                } else {
                    console.error(line);
                    console.error('Invalid state "' + parts[0] + '", should be "vertex" or "endloop"');
                    return;
                }
                break;
            case 'endloop':
                if (parts[0] !== 'endfacet') {
                    console.error(line);
                    console.error('Invalid state "' + parts[0] + '", should be "endfacet"');
                    return;
                } else {
                    state = 'endfacet';
                }
                break;
            case 'endfacet':
                if (parts[0] === 'endsolid') {
                    geo.computeFaceNormals(); //TODO: ENLEVER + tard ?
                    var col = new THREE.Color("gray");
                    // var material = new THREE.MeshLambertMaterial( { color:col} );
                    // var material = new THREE.MeshPhongMaterial( {
                    //     color: 0x996633,
                    //     // envMap: envMap, // optional environment map
                    //     specular: 0x050505,
                    //     shininess: 100
                    // } );
                    var material = new THREE.MeshStandardMaterial({color: col});
                    mesh = new THREE.Mesh( geo, material);
                    mesh.material.shading = THREE.SmoothShading;
                    // mesh.scale.x = -1;
                    console.log("ICIIII");
                    scene.add(mesh);
                    done = true;
                } else if (parts[0] === 'facet' && parts[1] === 'normal') {
                    normal = [
                        parseFloat(parts[2]),
                        parseFloat(parts[3]),
                        parseFloat(parts[4])
                    ];
                    if (vCount % 1000 === 0) {
                        console.log(normal);
                    }
                    state = 'facet normal';
                } else {
                    console.error(line);
                    console.error('Invalid state "' + parts[0] + '", should be "endsolid" or "facet normal"');
                    return;
                }
                break;
            default:
                console.error('Invalid state "' + state + '"');
                break;
        }
    }
};

function geometry_from_triangles(triangles){
    var t = generate_triangles();
    var limits = get_limits();
    var mx = limits[0];
    var Mx = limits[1];
    var my = limits[2];
    var My = limits[3];
    var dx = -mx -(Mx-mx)/2;
    var dy = -my -(My-my)/2;
    var box_t = get_box_triangles(mx-100,my-100,-10, Mx-mx+200,My-my+200,0,0);
    for(var i=0; i<box_t.length; i++)
        t.push(box_t[i]);
    var stl_str = get_stl_str(t, -10);
    parseStl(stl_str);
}

init();
animate();

function init() {

    //Detector.addGetWebGLMessage();
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.z = 600;
    camera.position.y = 100;
    camera.lookAt (new THREE.Vector3(0,0,0));
    scene.add( camera );


    var light1 = new THREE.PointLight( 0x777777, 1.8, 0);
    light1.position.set(-300, 200, 300);
    scene.add(light1);

    var light2 = new THREE.DirectionalLight( 0x887777, 0.5);
    light2.position.set( -1,1.6,1 ).normalize();
    light2.castShadow = true;
    scene.add(light2);
    //
    var lightAmb = new THREE.AmbientLight(0x777777, 1.6);
    scene.add(lightAmb);

    function load_stl(filename){
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if ( xhr.readyState == 4 ) {
                if ( xhr.status == 200 || xhr.status == 0 ) {
                    // console.log(xhr.response);
                    // parseStlBinary(xhr.response);
                    // console.log(xhr.responseText);
                    parseStl(xhr.responseText);
                    // mesh.rotation.x = 5;
                    // mesh.rotation.z = .25;
                    console.log('done parsing');
                }
            }
        }
        xhr.onerror = function(e) {
            console.log(e);
        }

        xhr.open( "GET", 'octocat.stl', true );
        // xhr.responseType = "arraybuffer";
        xhr.responseType = "text";
        //xhr.setRequestHeader("Accept","text/plain");
        //xhr.setRequestHeader("Content-Type","text/plain");
        //xhr.setRequestHeader('charset', 'x-user-defined');
        xhr.send( null );
    }

    geometry_from_triangles();
    // load_stl("");
    mesh.rotation.x = 5;
    mesh.rotation.z = .25;


    renderer = new THREE.WebGLRenderer({ alpha: true, antialias : true }); //new THREE.CanvasRenderer();
    renderer.setSize( 0.7*window.innerWidth, 0.7*window.innerHeight );
    document.getElementById("scene3d").appendChild( renderer.domElement );
    renderer.setClearColor( 0x000000, 1 );

    controls = new THREE.OrbitControls(camera, renderer.domElement );

    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
	controls.dampingFactor = 0.1;

	controls.screenSpacePanning = false;

	controls.minDistance = 100;
	controls.maxDistance = 1200;

	controls.maxPolarAngle = Math.PI/2;


    //
    // stats = new Stats();
    // stats.domElement.style.position = 'absolute';
    // stats.domElement.style.top = '0px';
    // document.body.appendChild(stats.domElement);
}

function animate() {

    // note: three.js includes requestAnimationFrame shim
    requestAnimationFrame( animate );
    render();
    // stats.update();

}

function render() {

    //mesh.rotation.x += 0.01;
    mesh.rotation.z += 0.01;
    // light.position.z -= 500;

    controls.update();
    renderer.render( scene, camera );

}
