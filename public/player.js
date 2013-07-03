window.onload=function()
{

    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    
    ctx.globalCompositeOperation = "lighter";

    var W_WIDTH = window.innerWidth;
    var W_HEIGHT = window.innerHeight;

    //responsive design parameters
    var proportion = false;
    if(W_WIDTH>=W_HEIGHT){
        proportion = W_HEIGHT/768;
    } else {
        proportion = W_WIDTH/1336;
    }

    console.log("screen proportion: ", proportion);

    canvas.width = W_WIDTH/4;
    canvas.height = W_HEIGHT*0.5;
    
    var container = $("#canvasContainer");
    container.append(canvas);
    
    //image element
    var img=new Image();
    img.src = "cb2-transparent.png";
    
    //initialize canvas
    function init() {
    
            //on image load draw image to canvas
        img.onload = function(){
            canvas.width = img.width*proportion;
            canvas.height = img.height*proportion;
            console.log("img load");
            ctx.drawImage(this,0,0,canvas.width,canvas.height);
        }
        
        return setInterval(draw, 40);
    }
    
    /*init function here...........*/
    init();
    /*int function here ...........*/
    
    var dx=1,dy=1; //unit of movement for x and y coordinates
    var currentNode = 0;
    
    var vector = function(x,y){
        this.x=x;
        this.y=y;
    }

    function vectorDistance(v1,v2, cx,cy){
        var r = (v2.y-v1.y) * (v2.y-v1.y)*cy*cy + (v2.x-v1.x) * (v2.x-v1.x)*cx*cx;
        return Math.sqrt(r);
    }
    
    window.currentPlayingPoint = false; //jquery object traveler

    /*
        * Prepend mask DOM object(s) to tree leafs mouse events (click, hover, touch) of nodes will be watched this way
        * Also returns on object with attributes: xPosition, yPosition, nodes array that point will visit (path),
        * Later this object will be used to draw and animate blue arcs
        *   x,y: current position
        *   nodeList: array of vectors of node's path'  
        *   nodeIndex --index of at which member of nodeList
        *   initialX and initialY -- initil point
        *       opacity
        *
        * Also this object is binded with important events for current node change and path complete 
    */
    var $traveler = function(x,y,nodeList,id,marginLeft,marginTop, soundUrl){
    
        //this is init function
        var domObj = $("<div class='station' id=st_'"+id+"' style='height:"+10*proportion+"px;"+"width:"+10*proportion+"px;"+"left:"+marginLeft*proportion+"px;"+"top:"+marginTop*proportion+"px;"+"'></div>");
        container.prepend(domObj);
        //up to here
        
        var pathLength = 0;


        //calculate velocity default:1
        var velocity = 1;
        // if(sound!==undefined){
        //     velocity = pathLength/sound.duration*40;
        //     console.log("duraiton",velocity);
        // }
        
        for(var i=0; i<nodeList.length; i++){
            nodeList[i].x=nodeList[i].x*proportion;
            nodeList[i].y=nodeList[i].y*proportion;

        }

        for(var i=0; i<nodeList.length; i++){
            if(nodeList[i+1]!==undefined){
                pathLength += vectorDistance(nodeList[i], nodeList[i+1], 1,1);
            }
        }

        var r = $({
            positionX : x*proportion,
            positionY : y*proportion,
            nodesOnPath: nodeList,
            nodeIndex: 0,
            initialX: x*proportion,
            initialY: y*proportion,
            opacity: 1,
            id: id,
            velocity: velocity*proportion,
            pathLength: Math.ceil(pathLength),
            sound: undefined
        });

        var self = r[0];

        domObj.click(function(){

            console.log("hehehehe", r[0].id);
            //play sound and stop current one
            if(self.sound!==undefined){

                if(self.sound.readyState===3){
                    if(self.sound.playState==1){ //if playing
                        self.sound.stop();
                        //and move circle to start point
                        //window.currentPlayingPoint = false;
                        r.trigger("pathComplete");
                        r.trigger("stop");
                    } else {

                        console.log(window.currentPlayingPoint, "on sound loaded");
                        window.currentPlayingPoint.trigger("pathComplete");
                        window.currentPlayingPoint.trigger("stop");

                        window.currentPlayingPoint = r;
                        self.sound.play();
                    }
                } 
            } else {
                console.log("sound loading for the first time")
                if(soundUrl!==undefined){
                    self.sound = soundManager.createSound({
                          id: r[0].id,
                          url: soundUrl,
                          autoLoad: true,
                          //autoPlay: false,
                          usePeakData: true,
                          useEQData: true,
                          useWaveformData: true,
                          onload: function() {
                            console.log('The sound '+this.sID+' loaded!');
                            
                            //var t = new $traveler(41,29,nl,1,30,24,sampleSound);

                            //set velocity
                            console.log(proportion);
                            r[0].velocity = r[0].pathLength/this.duration*40;
                            
                            //set currentPlayingPoint
                            if(window.currentPlayingPoint){
                                //currentPlayingPoint.trigger("reset");
                                window.currentPlayingPoint.trigger("pathComplete");
                                window.currentPlayingPoint.trigger("stop");                                
                                console.log("active playing sound", window.currentPlayingPoint, r[0]);
                            }else {
                                
                            }

                            window.currentPlayingPoint = r;
                            r.trigger("pathComplete");
                            console.log("crrentl palyi this must be self", window.currentPlayingPoint, r[0]);
                            this.play();
                          },

                          whileplaying: function(){
                            //console.log(space.Z);
                            //space.Z = this.peakData.left*2 + 0.01;
                            //space.starWidth = this.peakData.left*300;
                            // if(this.peakData.left>this.peakData.right){
                            //     mousex = width/8;
                            // }else {
                            //     mousex = width*7/8;
                            // }
                            //starWidth = 55+100*(1/Z);
                          },
                          volume: 50
                    });
                }

            }
        });
        
        //on every node change
        r.bind("nodeArrived", function(e){
            e.currentTarget.nodeIndex++; 
        });
        
        //on path complete
        r.bind("pathComplete", function(e){
            var o = e.currentTarget;
            o.positionX = o.initialX;
            o.positionY = o.initialY;
            o.nodeIndex = 0;
            o.opacity=1;

        });

        //on stop
        r.bind("stop", function(e){
            console.log("lenn");
            e.currentTarget.velocity = velocity*proportion;
            e.currentTarget.sound.stop();
        });

        r.on("reset", function(){
            console.log("resettting");
            this.trigger("pathComplete");
            this.trigger("stop");
        });
        
        return r;
    }
    
    var travelers = []; 
    var state="blur";
    
    /**
     * [moveTraveler description]
     * @param  {[vector]} $t [path array]
     * @return {[type]}    [description]
     */
    var moveTraveler = function($t, velocity){

        //getting [0] because this is jquery object
        var t = $t[0];

        var crr = t.nodeIndex;
        if(crr==t.nodesOnPath.length){
            t.nodeIndex++;
            $t.trigger("pathComplete");
            return;
        }
        
        //opacity
        if(crr>t.nodesOnPath.length-2){
            t.opacity = t.opacity - 0.01;
        }
        var node = t.nodesOnPath[crr];
        
        //move horizontally
        if(node.y==t.positionY){
            if( node.x-t.positionX > velocity){ //to right
                t.positionX+=velocity;
            }
            else if(t.positionX-node.x > velocity){  //to left
                t.positionX-=velocity;
            }
            else{
                t.positionX = node.x;
                $t.trigger("nodeArrived");
            }
        }

        //move vertically
        else if(node.x==t.positionX){
            if(node.y-t.positionY > velocity){
                t.positionY+=velocity;
            }
            else if(t.positionY-node.y > velocity){
                t.positionY-=velocity;
            }
            else{
                t.positionY = node.y;
                $t.trigger("nodeArrived");
            }
        }

        else if(node.x!=t.positionX && node.y!=t.positionY){
            
            if(node.x-t.positionX > velocity){
                t.positionX+=velocity;
            }
            else if(t.positionX-node.x > velocity){
                t.positionX-=velocity;
            }
            else{
                t.positionX = node.x
                //$t.trigger("nodeArrived");
                //return;
            }
            
            if(node.y-t.positionY > velocity){
                t.positionY+=velocity;
            }else if(t.positionY-node.y > velocity){
                t.positionY-=velocity;
            } else {
                t.positionY = node.y;
                $t.trigger("nodeArrived");
                return;
            }
        }
    }
    

    //t.trigger("nodeArrived");

    function clear() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    function rect(x,y,w,h,o) {
          ctx.beginPath();
          ctx.rect(x,y,w,h);
          ctx.globalAlpha = o;
          ctx.fillStyle = "#8ED6FF";
          ctx.closePath();
          ctx.fill();
    }
    
    function arc(x,y,r,o,lineWidth){
        ctx.beginPath();
        ctx.globalAlpha = o;
        ctx.arc(x,y,r,2*Math.PI,false);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = "#8ED6FF";
        ctx.stroke();
    }

    function eqArc(x,y,r,o,lineWidth){
        ctx.beginPath();
        ctx.globalAlpha = 0.5;
        ctx.arc(x,y,r,2*Math.PI,false);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = "#8ED6FF";
        ctx.stroke();        
    }

    var p1 = new vector(41,25);
    
    soundManager.onready(function(){

        var nl=[];
        var node1 = new vector(90,29);
        var node2 = new vector(90,47);
        var node3 = new vector(164,47);
        var node4 = new vector(219,99);
        var node5 = new vector(250,99);
        var node6 = new vector(250,110);
        var node7 = new vector(339,110);
        var node8 = new vector(350,114);
        var node9 = new vector(356, 128);
        var node10 = new vector(359,184);
        nl.push(_.clone(node1));
        nl.push(_.clone(node2));
        nl.push(_.clone(node3));
        nl.push(_.clone(node4));
        nl.push(_.clone(node5));
        nl.push(_.clone(node6));
        nl.push(_.clone(node7));
        nl.push(_.clone(node8));
        nl.push(_.clone(node9));
        nl.push(_.clone(node10));

        //x,y,path,id, marginLeft, marginTop, soundUrl
        var t = new $traveler(36,29,nl,1,30,24,"mp3/04. Squirrel And Biscuits.mp3");
        travelers.push(t);

        var nl2=[];
        var nt2_1 = new vector(57,47);
        nl2.push(nt2_1);
        nl2.push(_.clone(node3));
        nl2.push(_.clone(node4));
        nl2.push(_.clone(node5));
        nl2.push(_.clone(node6));
        nl2.push(_.clone(node7));
        nl2.push(_.clone(node8));
        nl2.push(_.clone(node9));
        nl2.push(_.clone(node10));
        var t2 = new $traveler(60,60,nl2,2, 54, 55, "/mp3/03 Carbon Based Lifeforms - Photosynthesis.mp3");
        travelers.push(t2);
        
        var nl3 = [];
        nl3.push(new vector(274,63));
        nl3.push(new vector(250,63));
        nl3.push(_.clone(node5));
        nl3.push(_.clone(node6));
        nl3.push(_.clone(node7));
        nl3.push(_.clone(node8));
        nl3.push(_.clone(node9));
        nl3.push(_.clone(node10));
        var t3 = new $traveler(276,52,nl3,3, 271, 47, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t3);
        
        var nl4 = [];
        nl4.push(new vector(116,80));
        nl4.push(new vector(127,69));
        nl4.push(new vector(186,69));
        nl4.push(_.clone(node4));
        nl4.push(_.clone(node5));
        nl4.push(_.clone(node6));
        nl4.push(_.clone(node7));
        nl4.push(_.clone(node8));
        nl4.push(_.clone(node9));
        nl4.push(_.clone(node10));
        var t4 = new $traveler(24,80,nl4, 4, 17, 74, "/mp3/03. Pagan Dream Machine.mp3");
        travelers.push(t4);
        
        var nl5 = [];
        nl5.push(new vector(105,92));
        nl5.push(new vector(127,69));
        nl5.push(new vector(186,69));
        nl5.push(_.clone(node4));
        nl5.push(_.clone(node5));
        nl5.push(_.clone(node6));
        nl5.push(_.clone(node7));
        nl5.push(_.clone(node8));
        nl5.push(_.clone(node9));
        nl5.push(_.clone(node10));
        var t5 = new $traveler(24,92,nl5, 5, 17, 85, "/mp3/08-SYS700.mp3");
        travelers.push(t5);

        var nl6 = [];
        nl6.push(new vector(93,104));
        nl6.push(new vector(127,69));
        nl6.push(new vector(186,69));
        nl6.push(_.clone(node4));
        nl6.push(_.clone(node5));
        nl6.push(_.clone(node6));
        nl6.push(_.clone(node7));
        nl6.push(_.clone(node8));
        nl6.push(_.clone(node9));
        nl6.push(_.clone(node10));
        var t6 = new $traveler(24,104,nl6, 6, 17, 97, "/mp3/09-PsychicGibbon.mp3");
        travelers.push(t6);
        
        var nl7 = [];
        nl7.push(new vector(84,116));
        nl7.push(new vector(93,104));
        nl7.push(new vector(127,69));
        nl7.push(new vector(186,69));
        nl7.push(_.clone(node4));
        nl7.push(_.clone(node5));
        nl7.push(_.clone(node6));
        nl7.push(_.clone(node7));
        nl7.push(_.clone(node8));
        nl7.push(_.clone(node9));
        nl7.push(_.clone(node10));
        var t7 = new $traveler(24,116,nl7, 7, 17, 108, "/mp3/01-1200_micrograms_-_the_magic_numbers.mp3");
        travelers.push(t7);

        var nl8 = [];
        //nl3.push(new vector(274,63));
        nl8.push(new vector(250,63));
        nl8.push(_.clone(node5));
        nl8.push(_.clone(node6));
        nl8.push(_.clone(node7));
        nl8.push(_.clone(node8));
        nl8.push(_.clone(node9));
        nl8.push(_.clone(node10));
        var t8 = new $traveler(253,43,nl8,8, 248, 42, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t8);

        //left of heart
        var nl9=[];
        var t9 = new $traveler(121,177,nl9,9, 116, 172, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t9);
        
        var nl10=[];
        var t10 = new $traveler(121,160,nl10,10, 116, 155, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t10);

        var nl11=[];
        var t11 = new $traveler(158,98,nl11,11, 153, 93, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t11);

        var nl12=[];
        var t12 = new $traveler(216,120,nl12,12, 211, 115, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t12);

        //north of heart
        var nl13=[];
        var t13 = new $traveler(330,86,nl13,13, 325, 81, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t13);

        var nl14=[];
        var t14 = new $traveler(338,24,nl14,14, 333, 19, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t14);

        var nl15=[];
        var t15 = new $traveler(360,40,nl15,15, 355, 35, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t15);

        var nl16=[];
        var t16 = new $traveler(401,30,nl16,16, 395, 25, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t16);

        var nl17=[];
        var t17 = new $traveler(413,30,nl17,17, 408, 25, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t17);

        var nl18=[];
        var t18 = new $traveler(418,76,nl18,18, 413, 71, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t18);

        //top, right
        var nl19=[];
        var t19 = new $traveler(464,43,nl19,19, 459, 37, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t19);

        var nl20=[];
        var t20 = new $traveler(566,41,nl20,20, 561, 35, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t20);  

        var nl21=[];
        var t21 = new $traveler(608,67,nl21,21, 603, 61, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t21);   

        var nl22=[];
        var t22 = new $traveler(534,84,nl22,22, 529, 78, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t22);   

        var nl23=[];
        var t23 = new $traveler(611,102,nl23,23, 606, 96, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t23); 

        //top right bottom (next 4)    
        var nl24=[];
        var t24 = new $traveler(544,133,nl24,24, 538, 127, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t24); 

        var nl25=[];
        var t25 = new $traveler(557,133,nl25,25, 551, 127, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t25); 

        var nl26=[];
        var t26 = new $traveler(570,133,nl26,26, 564, 127, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t26); 

        var nl27=[];
        var t27 = new $traveler(583,133,nl27,27, 577, 127, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t27);                                                     

        //bottom left -- right
        var nl28=[];
        var t28 = new $traveler(611,208,nl28,28, 605, 202, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t28); 

        var nl29=[];
        var t29 = new $traveler(624,215,nl29,29, 618, 209, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t29);

        var nl30=[];
        var t30 = new $traveler(594,266,nl30,30, 588, 260, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t30);   

        var nl31=[];
        var t31 = new $traveler(607,379,nl31,31, 601, 373, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t31); 

        var nl32=[];
        var t32 = new $traveler(619,379,nl32,32, 613, 373, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t32);                                          
        
        //bottom left ---left
        var nl33=[];
        var t33 = new $traveler(460,324,nl33,33, 454, 318, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t33);  

        var nl34=[];
        var t34 = new $traveler(452,377,nl34,34, 446, 371, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t34); 

        var nl35=[];
        var t35 = new $traveler(474,412,nl35,35, 468, 406, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t35);                      

        //bottom left --bottom
        var nl36=[];
        var t36 = new $traveler(587,485,nl36,36, 581, 479, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t36); 

        var nl37=[];
        var t37 = new $traveler(587,506,nl37,37, 581, 500, "/mp3/Gui Boratto - Like You.mp3");
        travelers.push(t37);
                         
        console.log("travelers: ", travelers);
        
    //  bind click events to mask,
    //  they are already id attributed iwth own canvas node
    

    });
    function draw(){
        clear();
        
        ctx.save();
        //currently drawing image on every cycle 
        //i think a better way could be applied
        ctx.drawImage(img,0,0,canvas.width, canvas.height);
        
        
        //draw arcs for every traveler, travler object managament can be improved dramatically
        //draw new arcs on every cycle
        $.each(travelers, function(idx, el){
            arc(el[0].positionX,el[0].positionY,4*proportion,el[0].opacity, 2);
            eqArc(el[0].initialX,el[0].initialY,6*proportion,1, 8);
            moveTraveler(el,el[0].velocity);
        });

        ctx.restore()
        
    }
    
    //init();
}
