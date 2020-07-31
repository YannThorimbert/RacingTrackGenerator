
console.log("ENTER RENDER")

var camera, scene, renderer, geometry, light, stats, controls;
var mesht, meshb;

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



var parseStl = function(stl, material) {
    var state = '';
    var lines = stl.split('\n');
    var geo = new THREE.Geometry();
    var name, parts, line, normal, done, vertices = [];
    var vCount = 0;
    stl = null;

    var mesh;

    for (var len = lines.length, i = 0; i < len; i++) {
        if (done) {
            return mesh;
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
                    geo.computeFaceNormals();
                    // var material = new THREE.MeshLambertMaterial( { color:col} );
                    // var material = new THREE.MeshPhongMaterial( {
                    //     color: 0x996633,
                    //     // envMap: envMap, // optional environment map
                    //     specular: 0x050505,
                    //     shininess: 100
                    // } );
                    mesh = new THREE.Mesh( geo, material);
                    mesh.receiveShadow = true;
                    mesh.castShadow = true;
                    scene.add(mesh);
                    done = true;
                    return mesh;
                } else if (parts[0] === 'facet' && parts[1] === 'normal') {
                    normal = [
                        parseFloat(parts[2]),
                        parseFloat(parts[3]),
                        parseFloat(parts[4])
                    ];
                    // if (vCount % 1000 === 0) {
                    //     console.log(normal);
                    // }
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
    var stl_str = get_stl_str(t, -10);
    var colt = new THREE.Color("gray");
    var materialt = new THREE.MeshStandardMaterial({color: colt, roughness:0.1, metalness:0.1, envMapIntensity:1.});

    // var materialt = new THREE.MeshStandardMaterial( {
	// 				metalness: 0.01,
	// 				roughness: 0.01,
	// 				envMapIntensity: 1.0
	// 			} );
    // materialt.shading = THREE.SmoothShading;

    // function exr(){
    //     var exrCubeRenderTarget, exrBackground;
    //     var pmremGenerator = new THREE.PMREMGenerator( renderer );
    //     pmremGenerator.compileEquirectangularShader();
    //     var exrloader = new THREE.EXRLoader().setDataType( THREE.UnsignedByteType ).load( 'env.exr', function ( texture ) {
    //                         exrCubeRenderTarget = pmremGenerator.fromEquirectangular( texture );
    //                         exrBackground = exrCubeRenderTarget.texture;
    //                         texture.dispose();
    //                         materialt.envmap = exrCubeRenderTarget ? exrCubeRenderTarget.texture : null;
    //                         scene.background = exrBackground;
    //                         materialt.needsUpdate = true;
    //                         console.log("VERIF1", materialt.envmap);
    //                     } );
    // }
    //
    //
    // const secondFunction = async () => {
    //   const result = await exr();
    // }
    // secondFunction();

    mesht = parseStl(stl_str, materialt);
    // console.log("VERI2", materialt.envmap);

    //
    var limits = get_limits();
    var mx = limits[0];
    var Mx = limits[1];
    var my = limits[2];
    var My = limits[3];
    var dx = -mx -(Mx-mx)/2;
    var dy = -my -(My-my)/2;
    var box_t = get_box_triangles(mx-100,my-100,-10, Mx-mx+200,My-my+200,0);
    var stl_box = get_stl_str(box_t, -10);
    var colb = new THREE.Color("green");
    var materialb = new THREE.MeshStandardMaterial({color: colb});
    meshb = parseStl(stl_box, materialb);

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
    // light1.castShadow = true;
    scene.add(light1);
    // var lightHelper = new THREE.PointLightHelper( light1 );
    // scene.add( lightHelper );

    var spotLight = new THREE.SpotLight( 0xffffff, 1 );
    spotLight.position.set( 500, 400, 200 );
    spotLight.angle = 0.4;
    spotLight.penumbra = 0.05;
    spotLight.decay = 1;
    spotLight.distance = 2000;
    spotLight.castShadow = true;
    scene.add( spotLight );
    spotLight.target.position.set( 3, 0, - 3 );
    scene.add( spotLight.target );
    //
    // var lightHelper = new THREE.SpotLightHelper( spotLight );
    // scene.add( lightHelper );

    var light2 = new THREE.DirectionalLight( 0x887777, 0.5);
    light2.position.set( -200,100,100 )
    // light2.castShadow = true;
    // light2.shadow.mapSize.width = 512;  // default
    // light2.shadow.mapSize.height = 512; // default
    // light2.shadow.camera.near = 0.5;    // default
    // light2.shadow.camera.far = 1000;     // default
    scene.add(light2);
    // var lightHelper = new THREE.DirectionalLightHelper( light2 );
    // scene.add( lightHelper );

    //
    var lightAmb = new THREE.AmbientLight(0x777777, 0.3);
    scene.add(lightAmb);

    // function load_stl(filename){
    //     var xhr = new XMLHttpRequest();
    //     xhr.onreadystatechange = function () {
    //         if ( xhr.readyState == 4 ) {
    //             if ( xhr.status == 200 || xhr.status == 0 ) {
    //                 // console.log(xhr.response);
    //                 // parseStlBinary(xhr.response);
    //                 // console.log(xhr.responseText);
    //                 parseStl(xhr.responseText);
    //                 console.log('done parsing');
    //             }
    //         }
    //     }
    //     xhr.onerror = function(e) {
    //         console.log(e);
    //     }
    //
    //     xhr.open( "GET", 'octocat.stl', true );
    //     // xhr.responseType = "arraybuffer";
    //     xhr.responseType = "text";
    //     //xhr.setRequestHeader("Accept","text/plain");
    //     //xhr.setRequestHeader("Content-Type","text/plain");
    //     //xhr.setRequestHeader('charset', 'x-user-defined');
    //     xhr.send( null );
    // }

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias : true }); //new THREE.CanvasRenderer();
    renderer.setSize( 0.7*window.innerWidth, 0.7*window.innerHeight );
    document.getElementById("scene3d").appendChild( renderer.domElement );
    renderer.setClearColor( 0x000000, 1 );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

    geometry_from_triangles();
    // load_stl("");
    mesht.rotation.x = -PI/2;
    meshb.rotation.x = -PI/2;


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
    mesht.rotation.z += 0.01;
    meshb.rotation.z += 0.01;
    mesht.position.y = 0;
    meshb.position.y = 0;

    controls.update();
    renderer.render( scene, camera );

}
