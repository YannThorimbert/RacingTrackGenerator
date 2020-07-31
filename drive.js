
function go_to(x,y,z){
    camera.position.x = x;
    camera.position.y = y;
    camera.position.z = z;
}

function drive_render() {

    //mesh.rotation.x += 0.01;
    // mesht.rotation.z += 0.01;
    // meshb.rotation.z += 0.01;
    // mesht.position.y = 0;
    // meshb.position.y = 0;

    controls.update();
    renderer.render( scene, camera );

}
