/**
 * 
 * @author RadiatedMonkey / https://github.com/RadiatedMonkey
 * 
 */

let modelState = [];
let tempReadModel;

//Initialize

let scene, camera, light, grid, renderer, textureLoader;

(function() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    renderer = new THREE.WebGLRenderer({antialias: true});
    textureLoader = new THREE.TextureLoader();

    camera.position.set(50, 50, 50);
    camera.rotation.y = -90;

    renderer.setClearColor("#fff");
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMapSoft = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', function() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;

        camera.updateProjectionMatrix();
    });

    //Camera controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.rotateSpeed = 0.75;
    controls.mouseButtons = {
        RIGHT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.ZOOM
    };

    // Grid
    scene.add(new THREE.GridHelper(50, 50, 0x00ff00));

})();

function read(url) {

    let to_remove = [];

    scene.traverse ( function( child ) {
        if ( child instanceof THREE.Mesh && !child.userData.keepMe === true ) {
            to_remove.push( child );
            }
    } );

    for ( var i = 0; i < to_remove.length; i++ ) {
        scene.remove( to_remove[i] );
    }

    let http = new XMLHttpRequest();
    http.open("GET", url, true);

    http.onreadystatechange = () => {
        if(http.readyState === 4) {
            if(http.status >= 200 && http.status < 400) {
                let dataValues = [];
                let tempModel = [];

                const request = new XMLHttpRequest();
                request.open('GET', 'variants.json', true);
                request.send();

                request.onreadystatechange = function() {
                    if(this.readyState === 4) {
                        if(this.status >= 200 && this.status < 400) {
                            dataValues = JSON.parse(this.responseText);
                            let dataKeys = Object.keys(dataValues);
                            JSON.parse(http.responseText).forEach(item => {
                                let keyMatch;
                                dataKeys.forEach(key => {
                                    if(item.n === dataValues[key][0] && item.i === dataValues[key][1]) {
                                        keyMatch = key;
                                    }
                                });
                        
                                if(keyMatch) {
                                    tempModel.push({
                                        n: keyMatch.replace(/oak_log/g, "oak_wood"),
                                        i: 0,
                                        c: item.c
                                    })
                                } else {
                                    tempModel.push(item);
                                }
                            });
                            placeModel(tempModel);
                        } else {
                            alert(`Failed to load block variants\n${request.response}`);
                        }
                    }
                }
            } else {
                console.log(http.response);
                alert(`Something went wrong requesting the model\n${http.response}`);
            }
        }
    }

    http.send();

    function placeModel(modelData) {
        console.log(modelData.length, modelData);
        for(let i = 0; i < modelData.length; i++) {
            let item = modelData[i];
            let BlockMat = new THREE.MeshBasicMaterial({
                map: textureLoader.load(`resources/blocks/${item.n}.png`)
            });

            let BlockGeo = new THREE.BoxGeometry(1, 1, 1);
            let Block = new THREE.Mesh(BlockGeo, BlockMat);

            Block.position.set(item.c[0] - 0.5, item.c[1] + 0.5, item.c[2] - 0.5);
                
            scene.add(Block);
        }
    }
}



const render = function() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}
render();