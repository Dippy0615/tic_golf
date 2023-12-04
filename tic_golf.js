// title:   TIC Golf
// author:  Dippy
// desc:    A standard golf game, made for the TIC-80.
// site:    website link
// license: MIT License (change this to your license of choice)
// version: 0.1
// script:  js

DEBUG = false; //debug mode toggle
objs = []; //all active objects will sit in this array
objs_depth = []; //array for drawing objects with depth
PLAYER = -1; //player (ball) object will be stored in here, for easy referencing

//game states
STATE_GAME_INIT = 0;
STATE_SPLASH = 2;
STATE_TITLE = 3;
STATE_HOWTOPLAY = 4;
STATE_PREVIEW = 5;
STATE_LEVEL_INIT = 6;
STATE_INGAME = 7;
STATE_END = 8;

//arrays containing the tiles for
//the different ground types
fairway_tiles = [1, 4, 5, 6, 7, 35, 36, 37, 38];
rough_tiles = [2, 17, 18, 19, 20, 22, 25, 30, 43];
bunker_tiles = [12, 13, 14, 15, 16, 39, 40, 41, 42];
water_tiles = [21, 43];
green_tiles = [3, 8, 9, 10, 11, 24, 31, 44];

//animation arrays
ball_water_anim = [258, 259, 260, 261, 0];
ball_hole_anim = [262, 263, 264, 265, 0];

//array containing par values
pars = [4, 4, 4, 4, 4, 4, 4, 4, 8, 4, 8, 4, 4, 4, 4, 4];

//array containing the score for each level
scores = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

//mget2:
//custom version of the mget function that
//accounts for the current level
//x and y are NOT in map cells
function mget2(_x, _y){
	return mget((_x+(gc.lvlx*8))/8,(_y+(gc.lvly*8))/8);
}

function lerp(_a, _b, _percent){return _a+(_b-_a)*_percent};

//del:
//delete a given object from the objs array
function del(obj, removeDepth){
 objs.splice(objs.indexOf(obj),1);
 if(removeDepth!=null&&removeDepth==true)
  objs_depth.splice(objs_depth.indexOf(obj),1);
}

//approxZero: 
//determines whether or not a number is
//'approximately' zero based on a given number and a max
//returns either the given number or 0
function approxZero(_num, _max){
 if (Math.abs(_num)<=_max) return 0;
 	else return _num;
}

function getLevelScoring(){
	if(gc.stroke<gc.par){
		var diff = gc.par-gc.stroke;
		if(diff==1) return "BIRDIE";
		if(diff==2) return "EAGLE";
		if(diff==3) return "ALBATROSS";
		if(diff<=4) return "-"+diff;
	}
 if(gc.stroke==gc.par) return "PAR";
 if(gc.stroke>gc.par){
  var diff = gc.stroke-gc.par;
  if(diff==1) return "BOGEY";
  if(diff==2) return "DOUBLE BOGEY";
  if(diff==3) return "TRIPLE BOGEY";
  if(diff==4) return "QUADRUPLE BOGEY";
  if(diff>=5) return "+"+diff;
 }
}

//getGroundType:
//takes in an X and Y coordinate and,
//returns the ground type as a number
//-1 = N/A
// 0 = fairway
// 1 = rough
// 2 = green
// 3 = bunker
// 4 = water
function getGroundType(_x, _y)
{
	var tile = mget2(_x, _y);
	if(fairway_tiles.indexOf(tile)>-1) return 0;
	else if(rough_tiles.indexOf(tile)>-1) return 1;
	else if(green_tiles.indexOf(tile)>-1) return 2;
	else if(bunker_tiles.indexOf(tile)>-1) return 3;
	else if(water_tiles.indexOf(tile)>-1) return 4;
	else return -1;
}

//textHCenter:
//takes in a string and returns an X coordinate that will
//center the text horizontally.
function textHCenter(_str){
 return 124-_str.length*3;
}

//pol2car:
// takes angle in degrees && distance && 
// calculates the x/y offset
// this function is a JS version of another function found
// in this cart by capturts: https://tic80.com/play?cart=2682
function pol2car(_angle,_distance){
	_angle = _angle*Math.PI/180;
	var dx=0;
	var dy=0;
	if (_angle==0)
		dy=0-_distance;
	else if (_angle==90)
		dx=_distance;
	else if (_angle==180)
		dy=_distance;
	else if (_angle==270)
		dx=0-distance;
	else if (_angle>0 && _angle<90) {
		dx=Math.sin((_angle))*_distance;
		dy=0-Math.cos((_angle))*_distance;
	}
	else if (_angle>90 && _angle<180) {
		dx=Math.cos((angle-90))*_distance;
		dy=Math.sin((angle-90))*_distance;
	}
	else if (_angle>180 && _angle<270) {
		dx=0-Math.sin((angle-180))*_distance;
		dy=Math.cos((angle-180))*_distance;
	}
	else if (_angle>270 && _angle<360) {
		dx=0-Math.cos((angle-270))*_distance;
		dy=0-Math.sin((angle-270))*_distance;
	}
	var ret = [dx, dy];
	return ret;
}

//remove objects that are uneeded outside of the ingame state
function removeUnneededObjects(){
//had to make the for loop repeat this code a lotta times cause it wouldn't delete all of
//the marked objects doing the loop once for whatever reason
for(var t=0;t<7;t++){
		for (obj in objs){
			var c = objs[obj];
			if(PLAYER!=-1){
			 objs.splice(objs.indexOf(PLAYER),1); 
			 objs_depth.splice(objs_depth.indexOf(PLAYER),1);
				PLAYER = -1;
			}
			trace(t+" "+c.type +" "+c.removeMe + " "+(gc.level-1));
			if(c.removeMe==true){
			 del(c);
				if(c.depth!=null)
				 objs_depth.splice(objs_depth.indexOf(c),1);
			}
		}
	}
}

function selectionSort(inputArr) { 
 var n = inputArr.length;
        
 for(var i = 0; i < n; i++) {
  // Finding the smallest number in the subarray
  var min = i;
  for(var j = i+1; j < n; j++){
   if(inputArr[j].depth > inputArr[min].depth) {
     min=j; 
   }
  }
  if (min != i) {
   // Swapping the elements
   var tmp = inputArr[i]; 
   inputArr[i] = inputArr[min];
   inputArr[min] = tmp;      
  }
 }
 return inputArr;
}

//Animator object:
//animates an object based on the given arguments.
//_anim = array containing all of the sprite indexes in the animation
//_speed = speed (in frames) of the animation
//_obj = the object that the animator will animate on
//_loop = boolean, whether or not the animation will loop
function Animator(_anim, _speed, _obj, _loop){
 this.type = "Animator";
 this.removeMe = true;
	this.anim = _anim;
	this.obj = _obj;
	this.counter = 0;
	this.current = 0;
	this.loop = _loop
	this.speed = _speed;
	this.end = false;
	this.process=function(){
	 if (this.counter>this.speed){
			this.counter = 0;
			if(this.anim.length-1>=this.current+1){
			 this.current++;
				this.obj.sprite = this.anim[this.current];
			}
			else{
				if(this.loop){
					this.current = 0;
					this.obj.sprite = this.anim[this.current];
				}
					else {
					 this.obj.sprite = this.anim[this.current];
						del(this);
					}
			} 
		}
		else
		{
			this.counter++;
		}
	};
	objs.push(this);
}

//game control object
gc={
 type:"Control",
 removeMe:false,
 state:STATE_GAME_INIT, //game state machine
	game_state:0, //0 = normal, 1 = OB, 2 = hole
	level:0,
	lvlx:0, //the X cell to start drawing the map from
	lvly:0, //the Y cell to start drawing the map from
	depth:-500,
	camx:0, //camera x
	camLimitL: 120,
	camLimitR: 840,
	freecam:false,
	showHUD:true,
	drawArrows:false,
	windSpeed:5,
	windDir:1,
	par:0,
	stroke:0,
	score:0,
	nextState:-1,
	nextStateTime:0,
	nextLevel:-1, //if this greater than 0, it's the amt of frames until going to the next course.
	t:0, //time variable
	scoringX:-20,
	scoringW:0,
	scoringTextX:-40,
	playFanfare:-1,
	goToNextLevel:function(){
	 scores[this.level] = (this.stroke-this.par);
		this.score+=(this.stroke-this.par);
	 this.level++;
		//this.updateLevelOffsets();
		removeUnneededObjects();
		this.game_state = 0;
		this.scoringX = -20;
		this.scoringW = 0;
		this.scoringTextX = -40;
		if(this.level<16) this.state = STATE_PREVIEW;
	  else{
			 music(1, 0, 0, true);
			 this.state = STATE_END;
			}
	},
	updateLevelOffsets:function(){
	 this.lvlx = ((this.level%2)*120);
		this.lvly = ((Math.floor(this.level/2))*17);
	},
	process:function(){
  //state switcher
	 if(this.nextState>-1){if(this.nextStateTime<0)this.nextStateTime=60;}
			if(this.nextStateTime>-1) this.nextStateTime--;
			if(this.nextStateTime==0){
			 this.state = this.nextState;
				this.nextState = -1;
		}
		
		//when actually playing the game
	 if(this.state==STATE_INGAME){
			if(this.nextLevel>-1)this.nextLevel--;
			if(this.nextLevel==0)this.goToNextLevel();
			
			if(PLAYER!=-1){
			 if(gc.game_state==1){
				 var ob="OUT OF BOUNDS"
					if((Math.sin(time()/64))>0)
				 	print(ob,85,68,0);
				}
			}
			
			//if(btnp(7)){
			// this.goToNextLevel();
			//	this.level = 15;
			//}
			
			//toggle freecam
			if(PLAYER!=-1){
				if (btnp(6)&&PLAYER.canShoot==true){
					this.freecam = !this.freecam;
					if(this.freecam==true) this.showHUD = false;
						else{
						this.drawArrows = false;
						this.showHUD = true; 
						this.camx = Math.max(PLAYER.x-120,0);
						}
				}
			}
			
			//---CAMERA CODE---///
			//normal camera
			if(!this.freecam){
			 if(PLAYER!=-1){
				 if(PLAYER.setShot==true||PLAYER.club==2){
					 if(PLAYER.x>this.camLimitL&&PLAYER.x<this.camLimitR){
					   this.camx = PLAYER.x-this.camLimitL;
						 }
				  if(PLAYER.x<=this.camLimitL) gc.camx = 0;
					 else if(PLAYER.x>=this.camLimitR)gc.camx = this.camLimitR-120;
					}
					else
					{
					 var px = PLAYER.predictor.x;
				  if(px>this.camLimitL&&px<this.camLimitR){
					  this.camx = lerp(this.camx,px-this.camLimitL, 0.1);
						}	
						if(px<=this.camLimitL)this.camx = lerp(this.camx,0,0.1);
					 else if(px>=this.camLimitR)this.camx = lerp(this.camx,this.camLimitR-120,0.1);
				 }
				}
			}
			else{
			 //freecam camera
				if(btn(3)) this.camx+=2;
				if(btn(2)) this.camx-=2;
				if(this.camx<0) this.camx = 0;
				if(this.camx>this.camLimitR-120) this.camx = this.camLimitR-120;
				if(this.t%20==0) this.drawArrows=!this.drawArrows;
			}
			
			if(this.camx>this.camLimitR-120) this.camx = this.camLimitR-120;
			if(this.camx<0) this.camx = 0;
	
	 }
		else this.playFanfare = -1;
		this.t++;
	},
	draw:function(){
	 //when actually playing the game
	 if(gc.state==STATE_INGAME){
		 //---HUD CODE---//
			if(PLAYER!=-1){
				if (this.showHUD){ 
					PLAYER.shootPowerBarY = lerp(PLAYER.shootPowerBarY,127,0.3);
				 PLAYER.shootHeightBarX = lerp(PLAYER.shootHeightBarX,231,0.3);
					PLAYER.clubX = lerp(PLAYER.clubX, 20, 0.3);
				}
				else {
					PLAYER.shootPowerBarY = lerp(PLAYER.shootPowerBarY,147,0.3);
					PLAYER.shootHeightBarX = lerp(PLAYER.shootHeightBarX,248,0.3);
				 PLAYER.clubX = lerp(PLAYER.clubX, -28, 0.3);
				}
			 
				//draw the power bar
				rect(70, PLAYER.shootPowerBarY, 100, 8, 0);
				rect(70, PLAYER.shootPowerBarY, Math.min(PLAYER.shootPower*100,100), 8, 2);
				print("POWER", 70, PLAYER.shootPowerBarY-6, 0);
				print("POWER", 71, PLAYER.shootPowerBarY-5, 12);
				var px = PLAYER.predictor.predictPower;
				line(70+(px*100),PLAYER.shootPowerBarY,70+(px*100),PLAYER.shootPowerBarY+7,12);
				
				//backspin indicator
				if(PLAYER.backspin){
				 print("BACKSPIN", 71, PLAYER.shootPowerBarY-12, 0);
					print("BACKSPIN", 70, PLAYER.shootPowerBarY-13, 3);
				}
				
				//draw the height bar
				rect(PLAYER.shootHeightBarX, 20, 8, 100, 0);
				rect(PLAYER.shootHeightBarX, 20, 8, Math.min(PLAYER.shootHeight*100,100), 9);
				var str = "HEIGHT";
				for(var i=0;i<str.length;i++){
					print(str.substring(i,i+1),PLAYER.shootHeightBarX-6,20+(i*6),0);
				 print(str.substring(i,i+1),PLAYER.shootHeightBarX-5,21+(i*6),12);
				}
				//draw the club
				rect(PLAYER.clubX-1, 113, 18, 18, 0);
				spr(PLAYER.club+272, PLAYER.clubX, 114, 7, 2);
				var str2;
				switch(PLAYER.club){
					case 0: str2="DRIVER"; break;
					case 1: str2=" IRON "; break;
					case 2: str2="PUTTER"; break;
				}
				print(str2 ,PLAYER.clubX-8, 131, 0);
				//draw the arrows (for freecam mode)
				if(this.drawArrows){
					spr(275, 8, 136/2, 4);
					spr(275, 224, 136/2, 4, 1, 1);
				}
			}
			//}
			//draw the wind indicator
			var s = this.windDir*2;
			if(this.windSpeed>0){
				switch(this.windDir){ 
				 case 0:
						spr(288+s, 4, 4, 4);
						spr(288+s+1, 12, 4, 4);
						break;
					case 1:
						spr(288+s, 12, 0, 4);
						spr(288+s+1, 12, 8, 4);
						break;
					case 2:
						spr(288+s, 16, 4, 4);
						spr(288+s+1, 8, 4, 4);
						break;
				 case 3:
						spr(288+s, 12, 10, 4);
						spr(288+s+1, 12, 2, 4);
						break;
				}
			}
			var str = this.windSpeed+" mph";
			print(str,3,16,0);
			//draw current hole and par
			var str3 = ("HOLE "+(this.level+1)+"   PAR "+this.par+"  STROKE "+this.stroke);
			print(str3, 85-(str3.length), 0, 0);
			//draw the current stroke
			//var str4 = "STROKE "+this.stroke;
			//print(str4,234-(str4.length*8), 0, 0);
			
			if(this.game_state==2){
			 this.scoringW+=10;
			 rect(this.scoringX,58,this.scoringW,20,0);
				var str = getLevelScoring();
				this.scoringTextX = lerp(this.scoringTextX,textHCenter(str),0.04);
				print(str,this.scoringTextX,64,4);
				if(this.scoringW>2000){
				 this.goToNextLevel();
			}
			if(this.playFanfare>-1)this.playFanfare--;
			if(this.playFanfare==0){
			 if(this.stroke<this.par) music(2,0,0,false);
				else if(this.stroke==this.par) music(3,0,0,false);
				else if(this.stroke>this.par) music(4,0,0,false);
			}
			
		 }
		}
	},
}
objs.push(gc);
objs_depth.push(gc);

//scan map and create objects accordingly
function makeLevelObjects(){
	if(gc.level>0) removeUnneededObjects();
	for(var i=0;i<120;i++){
		for(var j=0;j<17;j++){
			var tile = mget(i+gc.lvlx,j+gc.lvly);
			if(tile==32){PLAYER = new Ball(i*8,j*8); mset(i+gc.lvlx,j+gc.lvly,1);}
			if(tile==31){new Hole(i*8,j*8); new Flag(i*8,j*8);}
		 if(tile==33){new Tree(i*8,j*8); mset(i+gc.lvlx,j+gc.lvly,1);}
		 if(tile==34){new Tree(i*8,j*8); mset(i+gc.lvlx,j+gc.lvly,2);}
		}
	}	
}

//Flag object
function Flag(_x, _y){
 this.removeMe = true;
 this.visible = true;
 this.x = _x;
 this.y = _y;
 this.depth = 0;
 this.process=function(){
  this.depth = -this.y;
  if(getGroundType(PLAYER.lastX,PLAYER.lastY)==2){
   this.visible = false;
  }
  else this.visible = true;
 }
 this.draw=function(){
  if(this.visible){
   spr(279,(this.x-2)-gc.camx,this.y-4, 0);
   spr(280,(this.x-2)-gc.camx,this.y-12, 0);
  }
 }
 objs.push(this);
 objs_depth.push(this);
}

//Hole object
function Hole(_x, _y){
 this.type = "Hole";
 this.removeMe = true;
	this.x = _x;
	this.y = _y;
	this.process=function(){
		
	 if(PLAYER.z>=0&&Math.abs(PLAYER.dX)<4&&Math.abs(PLAYER.dY)<4){
		 if(PLAYER.y>=this.y-1&&PLAYER.y+4<=this.y+8){
			 if(PLAYER.x>this.x-1&&PLAYER.x+4<this.x+9) PLAYER.holeBall();
	  }
		}
	}
	objs.push(this);
}

function Particle(_x, _y, _col1, _col2){
 this.removeMe = true;
 this.x = _x;
 this.y = _y;
 this.z = 0;
 this.col1 = _col1;
 this.col2 = _col2;
 this.dX = 0;
 this.dY = 0;
 this.dZ = 0;
 this.life = 0;
 this.lifeTime = 60*15;
 this.depth = 0;
 this.process=function(){
  this.life++;
  if(this.life>this.lifetime) del(this,true);
  if(getGroundType(this.x,this.y+this.z)==4) del(this,true);
  
  if(this.z>0){
   this.dX = 0;
   this.dY = 0;
   this.dZ = 0;
  }
  else this.dZ += 0.10;
  
  this.x += this.dX;
  this.y += this.dY;
  if(gc.state==STATE_INGAME){
	  this.z += this.dZ;
	  this.depth = -this.y;
  }
 };
 this.draw=function(){
  if(gc.state==STATE_INGAME){
  	rect(this.x+1-gc.camx,this.y+this.z+1,1,1,this.col1);
  	rect(this.x-gc.camx,this.y+this.z,1,1,this.col2);
  }
  else{
  	rect(this.x+1,this.y+this.z+1,1,1,this.col1);
  	rect(this.x,this.y+this.z,1,1,this.col2);
  }
 };
 objs.push(this);
 objs_depth.push(this);
}

//Tree object
function Tree(_x, _y){
	this.type = "Tree";
	this.removeMe = true;
	this.x = _x;
	this.y = _y;
	this.hasHit = false;
	this.depth = 0;
	this.process=function(){
	 
		if(PLAYER.z>=-9){
		 if(PLAYER.y>=this.y+2&&PLAYER.y+4<=this.y+16){
			 if(PLAYER.x>this.x&&PLAYER.x+4<this.x+8){
					if(!this.hasHit){
				  PLAYER.dX = 0;
						PLAYER.dY = 0;
						PLAYER.dZ = 0;
		    var rand = Math.random()*2;
						var l = new Leaf(this.x, this.y);
						l.z = PLAYER.z+.2;
						if(rand>=1){
						 var l2 = new Leaf(this.x, this.y);
							l2.z = PLAYER.z+.2;
						}
						this.hasHit = true;
					}
				}
	  }
	 }
		this.depth = (-this.y-4);
	}
	
	this.draw=function(){
		spr(276,this.x-gc.camx,this.y,1);
		spr(277,this.x-gc.camx,this.y+8,1);
	}
	objs.push(this);
	objs_depth.push(this);
}

//Leaf object
function Leaf(_x, _y){
 this.removeMe = true;
 this.x = _x;
 this.y = _y;
 this.z = 0;
 this.dZ = -0.015;
 
 this.depth = 0;
 this.sprite = 282;
 
 this.lifetime = 60*20;
 this.life = 0;
 
 this.process=function(){
  this.life++;
  if(this.life>this.lifetime){
   del(this,true);
  }
  if(this.z<0){
   var dir = Math.sin(time()/256+1)/6;
   this.x+=dir;
   if(dir>0) this.sprite = 283;
   if(dir<0) this.sprite = 281;
   if(approxZero(dir,0.05)==0) this.sprite = 282;
   this.dZ+=0.0025;
  }
  else this.dZ = 0;
  
  this.depth = -this.y;
  this.z += this.dZ;
 };
 this.draw=function(){
  spr(this.sprite,this.x-gc.camx,this.y+this.z,12,1);
 };
 objs.push(this);
 objs_depth.push(this);
}

function shotPredictor(){
 this.removeMe = true;
 this.x = PLAYER.x;
 this.y = PLAYER.y;
 this.z = 0;
 this.predictPower = 1;
 this.depth = -200;
 this.visible = false;
 this.process=function(){
  if(!PLAYER.setShot){
	  if(key(23)){
	   this.predictPower+=.01;
	   if(this.predictPower>1) this.predictPower = 1;
	  }
	  if(key(17)){
	   this.predictPower-=.01;
	   if(this.predictPower<0) this.predictPower = 0;
	  }
  }
  
  var x, y, z;
  x = 0;
  y = 0;
  z = 0;
  //simulate a shot
  var off = pol2car(PLAYER.angle, 3);
  var surface = getGroundType(PLAYER.x+2,PLAYER.y+2);
  
  var mult;
  if(PLAYER.club==0)mult=PLAYER.driverPower;
  else if(PLAYER.club==1)mult=PLAYER.woodPower;
  else if(PLAYER.club==2)mult=PLAYER.putterPower;
		
		var dX = (off[0])*PLAYER.shootSpeedX*(this.predictPower*mult);
	 var dY = (off[1])*PLAYER.shootSpeedY*(this.predictPower*mult);
		var dZ;
		if(PLAYER.club<2) dZ = PLAYER.shootSpeedZ*((1*mult))*-1;
		 else dZ = 0;
  
  if(surface==1){if(dX!=0)dX/=1.4;}
		if(surface==3){if(dX!=0)dX/=1.85;}
  
  var t = 0;
  while(true)
  {
   t++;
   if(PLAYER.club<2){
	   dZ += PLAYER.grav;
	   x += dX;
	   y += dY;
	   z += dZ;
	   if(z>0||t>5000){
	    if(t>5000){
	     // print("too long", 5, 10, 2);
	     // print("z "+z,5,18,2);
	    }
	    this.x = x+(PLAYER.x+2);
	    this.y = y+(PLAYER.y+4);
	    this.z = z;
	    break;
	   }
   }
   else{
    var surf = getGroundType((x+PLAYER.x+2)+2,(y+PLAYER.y+2));
    var fric = 0;
	   switch(surf){
						case 0: case 2:
						 //fairway or green
						 fric = PLAYER.fairwayFric;
						 dX = dX*0.92;
							break;
						case 1:
						 //rough
						 fric = PLAYER.roughFric;
						 dX = dX*0.82;
							break;
						case 3:
							//bunker
							fric = PLAYER.bunkerFric;
						 dX = dX*0.05;
						 dY = 0;
							break;
						case 4:
							//water
						 dX = 0;
							dY = 0;
							break;
				}
				if((dX==0&&dY==0)||t>5000){
				 if(t>5000){
	     //print("too long", 5, 10, 2);
	     //print("dX "+dX+" dY "+dY,5,18,2);
	    }
				 this.x = x+(PLAYER.x+2);
	    this.y = y+(PLAYER.y+2);
	    this.z = 0;
					break;
				}
				if(dX!=0){
				 if(dX>0)dX-=fric;
					else if(dX<0)dX+=fric;
				}
				if(dY!=0){
				 if(dY>0)dY-=fric;
					else if(dY<0)dY+=fric;
				}
			 dX = approxZero(dX,0.05);
		  dY = approxZero(dY,0.05);
				x += dX;
				y += dY;
			}
  }
  if(this.x+8>960) this.x=960-8;
  if(this.x<0) this.x = 0;
  if(this.y+8>136)this.y=136;
  if(this.y<4)this.y=4;
 };
 this.draw=function(){
   if(this.visible&&PLAYER.club<2){
   var hover = Math.sin(time()/64);
   circ(this.x-gc.camx,this.y-3,4,2);
   spr(278,(this.x-gc.camx)-3,(this.y-14)-hover,1);
  }
 };
 objs.push(this);
 objs_depth.push(this);
}

//Ball (player) object
function Ball(_x, _y)
{
	//init ball vars
	PLAYER = this;
	this.type = "Ball";
	this.removeMe = true;
	this.x = _x;
	this.y = _y;
	this.z = 0;
	
	this.dX = 0; //detla X
	this.dY = 0; //delta Y
	this.dZ = 0; //delta Z
	
	this.setShot = false;
	this.canShoot = true;
	this.isShooting = false;
	this.shootMode = 0; //0 = power, 1 = height
	this.shootSpeedX = 0.35;
	this.shootSpeedY = 0.4;
	this.shootSpeedZ = 0.75;
	this.shootPower = 0;
	this.shootHeight = 0;
	this.maxPower = 1;
	this.shootIncrement = 0.01;
	this.shootIncrementDir = 1;
	this.shootMultiplier = 0;
	
	this.driverPower = 2.3;
	this.woodPower = 1.8;
	this.putterPower = 2.4;
	
	this.showHUD = true;
	this.shootPowerBarY = 137;
	this.shootHeightBarX = 248;
	this.club = 0; //0 = driver, 1 = wood, 2 = putter
	this.clubX = -10;
	
	this.angle = 90;
	this.lineDist = 20; //distance for the angle line
	
	this.fric = 0;
	this.fairwayFric = 0.017;
	this.roughFric = 0.024;
	this.bunkerFric = 0.30;
	this.grav = 0.035;
	
	this.backspin = false;
	this.backspinDirX = 0;
	this.backspinDirY = 0;
	this.backspinAmountX = 0;
	this.backspinAmountY = 0;
	
	this.scale = 1;
	
	this.water = false;
	this.hole = false;
	
	this.lastX = this.x;
	this.lastY = this.y;
	this.respawn = -1;
	
	this.sprite = 256;
	
	this.depth = 0;
	
	this.predictor = new shotPredictor();
	
	this.shotTimer = 0;
	
	//when the ball enters the hole
	this.holeBall=function(){
	 if(!this.hole){
		 this.dX = 0;
			this.dY = 0;
			this.dZ = 0;
			this.hole = true;
			new Animator(ball_hole_anim, 4, this, false);
			//gc.nextLevel = 120;
			music();
			sfx(19, "E-4",40,3,15,0);
			gc.game_state = 2;
			gc.playFanfare = 20;
		}
	}
	
	//for waterlogging the ball
	this.waterBall=function(){
		if(!this.water){
				 this.dX = 0;
					this.dY = 0;
					this.dZ = 0;
				 this.water = true;
					new Animator(ball_water_anim, 4, this, false);
					this.respawn = 60;
					gc.stroke++;
					//this.canShoot = false;
				}
	}
	
	this.OBBall=function(){
	 gc.game_state = 1;
	 this.dX = 0;
		this.dY = 0;
		this.dZ = 0;
		this.respawn = 90;
	}
	
	this.respawnBall=function(){
			this.x = this.lastX;
			this.y = this.lastY;
			this.z = 0;
			this.dX = 0;
			this.dY = 0;
			this.dZ = 0;
			this.angle = 90;
			//this.shootPower = 0;
			//this.shootHeight = 0;
			this.sprite = 256;
			this.water = false;
			gc.stroke++;
			gc.camx = Math.max(PLAYER.x-120,0);
	  gc.game_state = 0;
	}
	
	//calculates the shot and launches the ball
	this.calculateShot=function()
 {
  var off = pol2car(this.angle, 3);
  var surface = getGroundType(this.x+2,this.y+2);
  
  if(this.backspin){
  	this.backspinDirX = Math.abs(-(off[0]));
  	this.backspinDirY = Math.abs(-(off[1]));
   this.backspinAmountX = this.backspinDirX/10.5;
   this.backspinAmountY = this.backspinDirY/10.5;
  }
  
  if(this.club==0)this.shootMultiplier=this.driverPower;
  else if(this.club==1)this.shootMultiplier=this.woodPower;
  else if(this.club==2)this.shootMultiplier=this.putterPower;
		
		this.dX = (off[0])*this.shootSpeedX*(this.shootPower*this.shootMultiplier);
	 this.dY = (off[1])*this.shootSpeedY*(this.shootPower*this.shootMultiplier);
	 if(this.club<2) this.dZ = this.shootSpeedZ*((this.shootHeight*this.shootMultiplier))*-1;
		 else{
			 this.dZ = 0;
				if(this.dX>0)this.dX+=0.15;
				if(this.dX<0)this.dX-=0.15;	
				if(this.dY>0)this.dY+=0.15;
				if(this.dY<0)this.dY-=0.15;
			}
			
		if(surface==1){
		 if(Math.abs(this.dX)>1){
			 for(var i=0;i<2;i++){
					var par = new Particle(this.x,this.y,5,7);
					par.dX = (Math.random()-.5);
					par.dY = (Math.random()-.5);
					par.dZ = -1;
				}
			}
		 if(this.dX!=0)this.dX/=1.4;
		}
		if(surface==3){
		 if(Math.abs(this.dX)>1)
			{
			 for(var i=0;i<2;i++){
					var par = new Particle(this.x,this.y,3,4);
					par.dX = (Math.random()-.5);
					par.dY = (Math.random()-.5);
					par.dZ = -1;
				}
			}
		 if(this.dX!=0)this.dX/=1.5;
		}
		this.isShooting = false;
		if(this.club!=2) sfx(1,"F-5",30,3,15,0);
   else sfx(4,"A#-5",30,3,15,0);
 }
	
	//ball logic
	this.process=function(){
	 if(!this.canShoot){
		 this.shotTimer++;
		}
	 else this.shotTimer = 0;
		
		
		if((this.y+4)<0||(this.y+this.z)>136||(this.x+8)<0||this.x>960){
		 if(gc.game_state!=1) this.OBBall();
  }
   		
		//ball respawning
		if(this.respawn>-1)this.respawn--;
			if(this.respawn==0)this.respawnBall();
		
		if(this.canShoot) this.predictor.visible = true;
   else this.predictor.visible = false;
   		
			//aiming & shooting
		if(this.canShoot&&gc.freecam==false)
		{
			if(this.canShoot)
			{
			 if(!this.isShooting)
				{
				 if(this.setShot==false)
					{
					 //club selecting
						if(btnp(1)){
							this.club++;
							if(this.club>2) this.club = 0;
						}
							if(btnp(0)){
							this.club--;
							if(this.club<0) this.club = 2;
						}
					
						//aim right
						if(btn(3)){
						 this.angle++;
							if (this.angle>360) this.angle = 0;
						}
						//aim left
						if(btn(2)){
							this.angle--;
							if (this.angle<0) this.angle = 360;
						}
					}
					if(btnp(5)&&this.setShot==true){
					 this.setShot = false;
					}
				}
			}
			
			//shoot
			if(btnp(4)){
				if(this.setShot){
					if(!this.isShooting)
						{
						 this.shootPower = 0;
							this.shootHeight = 0;
							this.shootMode = 0;
							this.isShooting = true;
						}
						else
						{
						 if(btn(1)&&this.club!=2){
							 if(!this.backspin) this.backspin = true;
							}
							this.shootMode++;
							if(this.shootMode==1) sfx(2,"G-5",5,3,13,2);
							if(this.shootMode==1&&this.club==2) this.shootMode = 2;
							if(this.shootMode==2){
							 this.predictor.visible = false; 
							 this.calculateShot();
							}
						}
				}
				if(!this.setShot){ 
				 this.setShot = true;
				}
			}
			
			if (this.isShooting){
				//handle the shoot modes
				if(this.shootMode==0){ //power
					this.shootPower+=(this.shootIncrement*this.shootIncrementDir);
					if(this.shootPower>this.maxPower||this.shootPower<0) this.shootIncrementDir*=-1;
     if(this.shootPower<0){this.shootPower=0; this.isShooting=false;}
    }
    else if (this.shootMode==1){ //height
     this.shootHeight+=(this.shootIncrement*this.shootIncrementDir);
     if(this.shootHeight>this.maxPower||this.shootHeight<0) this.shootIncrementDir*=-1;
    }
			}	
		}
		 
		//apply gravity and disable shooting when midair
		if(this.z<0) {
			this.dZ+=this.grav;
			this.canShoot = false;
		}
		else if(this.z==0){
		 if(this.dX!=0||this.dY!=0) this.canShoot = false;
		}
		
		//apply wind
		if (!this.canShoot&&this.z<0){
		 if(gc.t%100==0){
				switch(gc.windDir){
				 case 0: this.dX+=(gc.windSpeed/200); break;
					case 1: this.dY+=(gc.windSpeed/200); break;
					case 2: this.dX-=(gc.windSpeed/200); break;
					case 3: this.dY-=(gc.windSpeed/200); break;
				}
			}
		}
		
		//landing
		if (this.z>0||PLAYER.club==2){
		 //do bouncing and friction  based on surface that the ball is on
		 var surface = getGroundType(this.x+2,this.y+2);
			if((mget2(this.x+3),(this.y+3))==21){
				surface = 4;
			}
		 if(PLAYER.club!=2&&gc.game_state!=1){
			 if(surface!=4&&surface!=3) sfx(0,"A-2",30,3,14,0);
			 else if(surface==3) sfx(5,"G-1",60,3,15,0);
				else if(surface==4) sfx(3,"F#-4",60,3,15,0);
			}
			
			if(!this.hole){
				switch(surface){
					case 0: case 2: default:
					 //fairway or green
					 this.fric = this.fairwayFric;
						if(PLAYER.club!=2){
						 this.dX = this.dX*0.92;
						 this.dZ = (this.dZ*.55)*-1;
						}
						break;
					case 1:
					 //rough
					 this.fric = this.roughFric;
						if(Math.abs(this.dZ)>.65){
							for(var i=0;i<2;i++){
								var par = new Particle(this.x,this.y,5,7);
								par.dX = (Math.random()-.5);
								par.dY = (Math.random()-.5);
								par.dZ = -1;
							}
						}
						if(PLAYER.club!=2){
						 this.dX = this.dX*0.82;
						 this.dZ = (this.dZ*.45)*-1;
						}
						break;
					case 3:
						//bunker
						this.fric = this.bunkerFric;
						if(Math.abs(this.dZ)>.65){
						 for(var i=0;i<2;i++){
					   var par = new Particle(this.x,this.y,3,4);
					  	par.dX = (Math.random()-.5);
						  par.dY = (Math.random()-.5);
						  par.dZ = -1;
					  }
						}
					 this.dX = this.dX*0.05;
						//this.dY = 0;
						if(PLAYER.club!=2)
					  this.dZ = (this.dZ*0.15)*-1;
						break;
					case 4:
						//water
					 this.waterBall();
						break;
				}
			}
		 this.z = 0;
		}
		if (this.z==0)
		{
			//make sure the ball gets waterlogged
			if (getGroundType(this.x+2,this.y+2)==4) this.waterBall();
		}
		
		//friction & backspin
		if (this.z==0)
		{
		 if(this.backspin){
			 this.backspinAmountX = lerp(this.backspinAmountX,0,.12);
			 this.backspinAmountY = lerp(this.backspinAmountY,0,.12);
			}
			
			if (this.dX!=0){
				if (this.dX>0){
				 this.dX-=this.fric;
					if(this.dX<0)this.dX=0;
					if(this.shotTimer>15){
					 if(this.backspin)this.dX-=this.backspinAmountX;
					}
			 }
				if (this.dX<0){
				 this.dX+=this.fric;
					if(this.dX>0)this.dX=0;
					if(this.shotTimer>15){
					if(this.backspin)this.dX+=this.backspinAmountX;
					}
				}
			}
			if (this.dY!=0){
				if (this.dY>0){
				 this.dY-=this.fric;
					if(this.dY<0)this.dY=0;
					if(this.shotTimer>15){
						if(this.backspin)this.dY-=this.backspinAmountY;
					}
				}
				if (this.dY<0){
				 this.dY+=this.fric;
					if(this.dY>0)this.dY=0;
					if(this.shotTimer>15){
						if(this.backspin)this.dY+=this.backspinAmountY;
					}
				}
			}
		}
		
		//enable shooting if ball is still
		if (!this.water&&!this.hole){
			if (this.z==0&&this.dX==0&&this.dY==0&&this.dZ==0) 
				if (!this.isShooting){
					 if (!this.canShoot&&!gc.game_state==1){
						 if (getGroundType(this.x+2,this.y+2)==2) this.club = 2;
				   
							this.lastX = this.x;
							this.lastY = this.y;
							this.canShoot = true;
							this.setShot = false;
							this.predictor.visible = true;
							this.backspin = false;
							gc.stroke++;
						}
					}
		}
		
		//make sure the delta vars get to 0
		this.dX = approxZero(this.dX,0.05); 
		this.dY = approxZero(this.dY,0.05);
		if(this.z==0&&Math.abs(this.dX<1.4)&&Math.abs(this.dY<1.4)){
			this.dZ = approxZero(this.dZ,0.05);
		}
		//update the ball's position
		this.x+=this.dX;
		this.y+=this.dY;
		this.z+=this.dZ;
		//update the ball's scaling
		this.scale = Math.max(1,Math.abs(this.z>>4));
	 //update the ball's depth
		this.depth = -(this.y+this.z);
	}
	
	this.draw=function(){
		//draw the ball's shadow
		if(!this.water&&!this.hole) spr(257,this.x-gc.camx,this.y,12,1);
		//draw the ball
		spr(this.sprite,this.x-gc.camx,this.y+this.z,0,this.scale);
		//draw the angle line when using putter
		if(this.club==2){
			if(this.canShoot&&!this.hole){
				var off = pol2car(this.angle,this.lineDist);
				line(this.x+2-gc.camx,this.y+2,
				(this.x+2)+(off[0])-gc.camx,
				(this.y+2)+(off[1])
				,3);
			}
		}
		
		//debug stuff
		if(DEBUG){
			var str = "";
			str+="x: "+this.x+"\n";
			str+="y: "+this.y+"\n";
			str+="z: "+this.z+"\n";
			str+="camx: "+gc.camx+"\n";
			str+="dZ: "+this.dZ+"\n";
			str+="dX: "+this.dX+"\n";
			str+="dY: "+this.dY+"\n";
			str+="canShoot: "+this.canShoot+"\n";
			str+="isShooting: "+this.isShooting+"\n";
			str+="type: "+getGroundType(this.x+2,this.y+2)+"\n";
			str+="angle: "+this.angle+"\n";
			str+="power: "+this.shootPower+"\n";
			str+="fric: "+this.fric+"\n";
			str+="spr: "+this.sprite+"\n";
			str+="respawn: "+this.respawn+"\n";
			str+="setShot: "+this.setShot+"\n";
			str+="depth: "+this.depth+"\n";
			str+="gc.depth: "+gc.depth+"\n";
			str+="windSpeed: "+gc.windSpeed;
			print(str,5,5,0);
			print(str,4,4,4);
	 }
	}
	
	//add the ball to the objects array
	objs.push(this);
	objs_depth.push(this);
}

function objectCount(array,_type){
	var count = 0;
	for(obj in array){
	 var o = array[obj];
		if(o.type==_type) count++;
	}
	return count;
}

function titleMountain(_x, _y,_col,_spd){
 this.type = "Title Mountain";
 this.x = _x;
 this.y = _y;
 this.w = 120;
 this.h = 38;
 this.color = _col;
 this.speed = _spd;
 
 this.process=function(){
  var x1 = this.x;
  var y1 = this.y;
  var x2 = this.x+(this.w/2);
  var y2 = this.y-this.h;
  var x3 = this.x+this.w;
  var y3 = this.y;
  tri(x1,y1,x2,y2,x3,y3,this.color);
  
  this.x+=this.speed;
  if(this.x>240){
   this.x = -this.w;
  }
 };
 title.mountains.push(this);
}

function Minimap(){
 this.type = "Minimap";
 this.x = 0;
 this.y = -100;
 this.process=function(){
  if(gc.state!=STATE_PREVIEW){
   del(this);
  }
  for(var x=0;x<30*4;x++){
   for(var y=0;y<17;y++){
    var tile, col;
    tile = mget(gc.lvlx+x,gc.lvly+y);
    switch(tile)
    {
     case 1: col = 5; break;
     case 2: col = 6; break;
     case 3: col = 7; break;
     case 4: col = 5; break;
     case 5: col = 5; break;
     case 6: col = 5; break;
     case 7: col = 5; break;
     case 8: col = 7; break;
     case 9: col = 7; break;
     case 10: col = 7; break;
     case 11: col = 7; break;
     case 12: col = 4; break;
     case 13: col = 4; break;
     case 14: col = 4; break;
     case 15: col = 4; break;
     case 16: col = 4; break;
     case 17: col = 7; break;
     case 18: col = 7; break;
     case 19: col = 7; break;
     case 20: col = 7; break;
     case 21: col = 10; break;
     case 22: col = 6; break;
     case 23: col = 6; break;
     case 24: col = 6; break;
     case 25: col = 6; break;
     case 26: col = 7; break;
     case 27: col = 7; break;
     case 28: col = 7; break;
     case 29: col = 7; break;
     case 30: col = 7; break;
     case 31: col = 0; break;
     case 32: col = 12; break;
     case 33: col = 1; break;
     case 34: col = 1; break;
     case 35: col = 5; break;
     case 36: col = 5; break;
     case 37: col = 5; break;
     case 38: col = 5; break;
     case 39: col = 4; break;
     case 40: col = 4; break;
     case 41: col = 4; break;
     case 42: col = 4; break;
     case 43: col = 7; break;
     case 43: col = 5; break;
     default: col = 5; break;
    }
    rect(x*2+this.x,y*2+this.y,2,2,col);
   }
  }
  this.y = lerp(this.y,42,0.1);
 }
 objs.push(this); 
}

//title screen control object
title={
 mountains:[],
 textX:81,
 textY:-20,
 textYTarget:20,
 menu:["PLAY", "HOW TO PLAY"],
 cursor:0,
 bgCol:1,
 bgFade:[0,8,9,10],
 bgFadeTime:0,
 bgMtn1X:0,
 bgMtn1Y:136,
 bgMtnW:120,
 bgMtnH:68,
 canInput:true,
 hasMusPlayed:false,
 background:function(){
  if(this.bgFadeTime<this.bgFade.length-1){
   this.bgCol = this.bgFade[Math.floor(this.bgFadeTime)];
  }
  else this.bgCol = this.bgFade[this.bgFade.length-1];
  
  rect(0,0,240,136,this.bgCol);
  this.bgFadeTime+=0.25;
  
  //mountains
  if(objectCount(this.mountains,"Title Mountain")<6){
   //back layer
   new titleMountain(-60,136,7,.5);
   new titleMountain(60,136,7,.5);
   new titleMountain(180,136,7,.5);
   
   //front layer
   new titleMountain(-120,136,5,1);
   new titleMountain(0,136,5,1);
   new titleMountain(120,136,5,1);
  }
  for(obj in this.mountains){
   this.mountains[obj].process();
  }
 },
 checkMountains:function(){
  if(gc.state!=STATE_TITLE){
	  for(obj in this.mountains){
	   this.mountains.splice(this.mountains.indexOf(obj),1);
	  }
  }
 },
 process:function(){
  this.checkMountains();
  if(gc.state==STATE_TITLE){
   if(this.textY>35){
    if(!this.hasMusPlayed){
     music(1,0,0,true);
     this.hasMusPlayed=true;
    }
    //draw the background
			 this.background();
				
				//draw the menu options & cursor
	   for(var i=0;i<this.menu.length;i++){
	    var str = this.menu[i];
					print(str,textHCenter(str)+1,60+(i*8)+1,1);
	    print(str,textHCenter(str),60+(i*8),11);
	   }
	   var cursorX = Math.sin(time()/64);
	   spr(284,70+cursorX,60+(this.cursor*8)-1, 3);
	   
				if(this.canInput==true){
	   //move cursor down
	   if(btnp(1)){
			  sfx(2,"D-4",20,2,15,0);
	    this.cursor++;
	    if(this.cursor>this.menu.length-1){
	     this.cursor = 0;
	    }
	   }
	   //move cursor up
	   if(btnp(0)){
			  sfx(2,"D-4",20,2,15,0);
	    this.cursor--;
	     if(this.cursor<0){
	      this.cursor = this.menu.length-1;
	     }
	    }
	   
	  //make a selection
	  if(btnp(4)){
				 sfx(2,"G-4",20,2,15,0);
	     switch(this.cursor){
	      case 0:
	       //play
							 if(gc.nextState!=STATE_PREVIEW){
	        gc.nextState = STATE_PREVIEW;
									gc.score = 0;
									this.canInput = false;
									music();
							 }
	       break;
	      case 1:
	       //how to play
								if(gc.nextState!=STATE_HOWTOPLAY){
	        gc.nextState = STATE_HOWTOPLAY;
									this.canInput = false;
							 }
	       break;
	     }
	    }
				}
	  }
   
   //TIC GOLF!
	  this.textY+=.5;
			print("TIC GOLF", this.textX+1, Math.min(this.textY+1, this.textYTarget+1), 1, false, 2);
			print("TIC GOLF", this.textX, Math.min(this.textY, this.textYTarget), 4, false, 2);
  
   print("made by Dippy...       for battleofthebits.com",1,136-6,0);
  }
  else if(gc.state!=STATE_HOWTOPLAY){
   this.canInput = true;
  }
  else if(gc.state!=STATE_HOWTOPLAY&&gc.state!=STATE_END){
   this.hasMusPlayed = true;
  }
 },
}
objs.push(title);

howtoplay={
 page:0,
 maxPages:2,
 txt1:"Press LEFT and RIGHT to control",
 txt2:"the angle of your shot.",
 txt3:"Press UP and DOWN to",
 txt4:"change your club.",
 txt5:"Press Z to lock your shot.",
 txt6:"Once locked, press Z again",
 txt7:"to begin your shot.",
 txt8:"Press Z to choose",
 txt9:"the shot's height & power.",
 txt10:"Hold DOWN at the end of the shot",
 txt11:"to apply backspin.",
 txt12:"You can press A to enter freecam mode.",
 txt13:"Freecam lets you control the camera",
 txt14:"freely with LEFT and RIGHT.",
 txt15:"Press A again to exit freecam mode.",
 txt16:"You can also press Q and W",
 txt17:"To change the distance of the shot.",
 txt18:"That's all the knowledge you need!",
 txt19:"Now go become a TIC GOLF master!",
 txt20:"(X to go back to the title)",
 predictorY:63,
 predictorMove:false,
 predictorDir:-1,
 club:0,
 power:0,
 height:0,
 barTime:0,
 process:function(){
  if(gc.state==STATE_HOWTOPLAY){
   if(btnp(2)) this.page--;
   if(btnp(3)) this.page++;
   if(this.page<0)this.page=0;
   if(this.page>this.maxPages)this.page=this.maxPages;
   
   if(this.page==0){
	  	if(this.predictorMove){
		   this.predictorY+=(this.predictorDir*.15);
		  }
				
		  if(gc.t%40==0){
		   this.predictorMove = !this.predictorMove;
		  }
				if(gc.t%80==0){
	    this.predictorDir*=-1;
	   }
	   
	   if(gc.t%90==0){
	    this.club++;
	    if(this.club>2)this.club = 0;
	   }
   }
   if(this.page==1){
    this.barTime++;
    if(this.barTime<50){
     this.power++;
     this.height++;
    }
    if(this.barTime>120){
     this.barTime = 0;
     this.power = 0;
     this.height = 0;
    }
    
   }
   if(this.page==2){
    
   }
  }
 },
}
objs.push(howtoplay)

preview={
 t:0,
 txt:"",
 process:function(){
  if(gc.state==STATE_PREVIEW){
   this.txt="GET READY FOR HOLE "+(gc.level+1);
   this.t++;
  }
  else this.t = 0;
 },
}
objs.push(preview);

end={
 t:0,
 process:function(){
 	if(gc.state==STATE_END){
   this.t++;
  }
  else this.t = 0;
 },
}
objs.push(end);

splash={
 t:0,
 process:function(){
  if(gc.state==STATE_SPLASH){
   this.t++;
  }
  else this.t = 0;
 },
}
objs.push(splash);

function BOTB(){
 for(var i=0;i<4;i++){ for(var j=0;j<4;j++){ spr(320+(i*16)+(j),104+(j*8),48+(i*8),0); }}
 print("battle of the bits",88,84,15,false,1,true);
}

function TIC()
{
	cls();
	switch(gc.state){
	 case STATE_GAME_INIT:
		 gc.state = STATE_SPLASH;
			break;
		case STATE_SPLASH:
		 BOTB();
			if(splash.t>160) gc.state = STATE_TITLE;
		 break;
		case STATE_TITLE:
		 
		 break;
		case STATE_HOWTOPLAY:
		 rect(0,0,240,136,10);
			print("HOW TO PLAY",91,9,0);
		 print("HOW TO PLAY",90,8,2);
			print("("+howtoplay.page+"/"+howtoplay.maxPages+")",240-24,128,2);
			
			if(howtoplay.page==0){
				//left and right to control angle of shot
				print(howtoplay.txt1,textHCenter(howtoplay.txt1)+1,17,0);
				print(howtoplay.txt1,textHCenter(howtoplay.txt1),16,3);
				print(howtoplay.txt2,textHCenter(howtoplay.txt2)+1,24,0);
				print(howtoplay.txt2,textHCenter(howtoplay.txt2),23,3);
				print(howtoplay.txt16,textHCenter(howtoplay.txt16)+1,32,0);
				print(howtoplay.txt16,textHCenter(howtoplay.txt16),31,3);
				print(howtoplay.txt17,textHCenter(howtoplay.txt17)+1,40,0);
				print(howtoplay.txt17,textHCenter(howtoplay.txt17),39,3);
				
				spr(256, 80, 59, 0, 1);
				circ(128, howtoplay.predictorY, 4, 2);
				spr(278, 125, howtoplay.predictorY-14, 1);
				var s;
				if(howtoplay.predictorMove){
					if(howtoplay.predictorDir==-1) s = 304;
					 else s = 305;
				}
				else s = 308;
				spr(s, 150, 57, 3);
				
				//up and down to change clubs
				print(howtoplay.txt3,textHCenter(howtoplay.txt3)+1,79,0);
				print(howtoplay.txt3,textHCenter(howtoplay.txt3),78,3);
				print(howtoplay.txt4,textHCenter(howtoplay.txt4)+1,87,0);
				print(howtoplay.txt4,textHCenter(howtoplay.txt4),86,3);
				
				var c = 272+howtoplay.club;
				spr(c, 100, 100, 1, 2);
				spr(306, 130, 99, 1);
				spr(307, 130, 109, 1);
			}
			if(howtoplay.page==1){
			 //locking the shot
			 print(howtoplay.txt5,textHCenter(howtoplay.txt5)+1,17,0);
				print(howtoplay.txt5,textHCenter(howtoplay.txt5),16,3);
				print(howtoplay.txt6,textHCenter(howtoplay.txt6)+1,24,0);
				print(howtoplay.txt6,textHCenter(howtoplay.txt6),23,3);
				print(howtoplay.txt7,textHCenter(howtoplay.txt7)+1,31,0);
				print(howtoplay.txt7,textHCenter(howtoplay.txt7),30,3);
				
				//power & height
				print(howtoplay.txt8,textHCenter(howtoplay.txt8)+1,41,0);
				print(howtoplay.txt8,textHCenter(howtoplay.txt8),40,3);
				print(howtoplay.txt9,textHCenter(howtoplay.txt9)+1,49,0);
				print(howtoplay.txt9,textHCenter(howtoplay.txt9),48,3);
			 
				rect(70, 60, 100, 8, 0);
				rect(70, 60, howtoplay.power, 8, 2);
				var s;
				if(howtoplay.barTime>50){
				 if(howtoplay.barTime<80) s=309;
					 else s=308;
				}
				else s=308;
				spr(s, 70, 70, 3);
			
			 //applying backspin
				print(howtoplay.txt10,textHCenter(howtoplay.txt10)+1,81,0);
		  print(howtoplay.txt10,textHCenter(howtoplay.txt10),80,3);
			 print(howtoplay.txt11,textHCenter(howtoplay.txt11)+1,91,0);
    print(howtoplay.txt11,textHCenter(howtoplay.txt11),90,3);
    						
			}
			if(howtoplay.page==2){
			 //freecam
			 print(howtoplay.txt12,textHCenter(howtoplay.txt12)+1,17,0);
				print(howtoplay.txt12,textHCenter(howtoplay.txt12),16,3);
			 print(howtoplay.txt13,textHCenter(howtoplay.txt13)+1,24,0);
				print(howtoplay.txt13,textHCenter(howtoplay.txt13),23,3);
			 print(howtoplay.txt14,textHCenter(howtoplay.txt14)+1,32,0);
				print(howtoplay.txt14,textHCenter(howtoplay.txt14),31,3);
			 print(howtoplay.txt15,textHCenter(howtoplay.txt15)+1,40,0);
				print(howtoplay.txt15,textHCenter(howtoplay.txt15),39,3);
			
			 //tic golf master
				print(howtoplay.txt18,textHCenter(howtoplay.txt18)+1,67,0);
				print(howtoplay.txt18,textHCenter(howtoplay.txt18),66,3);
				print(howtoplay.txt19,textHCenter(howtoplay.txt19)+1,74,0);
				print(howtoplay.txt19,textHCenter(howtoplay.txt19),73,3);
			 print(howtoplay.txt20,textHCenter(howtoplay.txt20)+1,82,0);
				print(howtoplay.txt20,textHCenter(howtoplay.txt20),81,3);
			 
			}
			if(btnp(5)){
			 sfx(2,"D-3",20,2,15,0);
			 gc.state = STATE_TITLE;
				title.canInput = true;
			}
			break;
		case STATE_PREVIEW:
		 gc.updateLevelOffsets();
		 if(objectCount(objs,"Minimap")==0) new Minimap();
			//typewiter
			var ptxt = preview.txt;
			var str;
			str = ptxt.substring(0,(Math.min(Math.floor(preview.t/5),ptxt.length)));
			print(str,textHCenter(str),20,3);
			if(preview.t>=(60*2.5)){
			 var _str = "PRESS Z TO CONTINUE";
			 print(_str,textHCenter(_str),120,3);
			 if(btnp(4)){
				 if(gc.nextState!=STATE_INGAME) 
						gc.nextState = STATE_LEVEL_INIT;
				}
			}
			break;
		case STATE_LEVEL_INIT:
		 gc.camx = 0;
			gc.windDir = Math.round(Math.random()*3);
			gc.windSpeed = Math.round(Math.random()*20);
			gc.par = pars[gc.level];
			gc.stroke = 1;
			//gc.updateLevelOffsets();
			makeLevelObjects();
			if(gc.level<8) music(0,0,0,true);
			else music(5,0,0,true);
			gc.state = STATE_INGAME;
			break;
		case STATE_INGAME:
		 map(gc.lvlx,gc.lvly,30*4,17,-gc.camx,0);
		 break;
		case STATE_END:
		 //scores table
		 //0-8
		 //top
			line(40,10,96,10,12);
			//left
			line(40,10,40,98,12);
		 //right
			line(96,10,96,98,12);
			//bottom
			line(40,98,96,98,12);
			
			print("HOLE",40,12,12);
			line(64,10,64,98,12);
			print("SCORE",66,12,12);
			line(96,10,96,98,12);
			for(var c=0;c<8;c++){
			 print(c+1,50,21+(c*10),12);
				var s = scores[c];
				var str = "";
				if(s>0) str+="+";
				str+=s;
				print(str,78,21+(c*10),12);
		 	line(40,18+(c*10),96,18+(c*10),12);
			}
			
			//9-16
		 //top
			var add = 110;
			line(40+add,10,96+add,10,12);
			//left
			line(40+add,10,40+add,98,12);
		 //right
			line(96+add,10,96+add,98,12);
			//bottom
			line(40+add,98,96+add,98,12);
			
			print("HOLE",40+add,12,12);
			line(64+add,10,64+add,98,12);
			print("SCORE",66+add,12,12);
			line(96+add,10,96+add,98,12);
			for(var c=0;c<8;c++){
			 print(c+8+1,50+add,21+(c*10),12);
				var s = scores[c+8];
				var str = "";
				if(s>0) str+="+";
				str+=s;
				print(str,78+add,21+(c*10),12);
		 	line(40+add,18+(c*10),96+add,18+(c*10),12);
			}
			var str = "FINAL SCORE: "+gc.score;
			print(str,textHCenter(str),116,12);
			if(end.t>120){
				 var str2 = "THANKS FOR PLAYING!";
					print(str2,textHCenter(str2),128,12);
				
				if(btnp(4)){
					gc.level = 0;
				 gc.nextState = STATE_TITLE;
					title.hasMusPlayed = true;
				}
			}
			break;
	}
	//update all items in the objects array every frame
	for(obj in objs){objs[obj].process();}

 //sort and draw items in the depth array
 objs_depth = selectionSort(objs_depth);
 for(obj in objs_depth){
  objs_depth[obj].draw();
 }
}

// <TILES>
// 001:5555555555555555555555555555555555555555555555555555555555555555
// 002:6666666666666666666666666666666666666666666666666666666666666666
// 003:7777777777777777777777777777777777777777777777777777777777777777
// 004:6666666566666655666665556666555566655555665555556555555555555555
// 005:5666666655666666555666665555666655555666555555665555555655555555
// 006:5555555555555556555555665555566655556666555666665566666656666666
// 007:5555555565555555665555556665555566665555666665556666665566666665
// 008:6666666766666677666667776666777766677777667777776777777777777777
// 009:7666666677666666777666667777666677777666777777667777777677777777
// 010:7777777777777776777777667777766677776666777666667766666676666666
// 011:7777777767777777667777776667777766667777666667776666667766666667
// 012:4444444444444444444444444444444444444444444444444444444444444444
// 013:6666666466666644666664446666444466644444664444446444444444444444
// 014:4666666644666666444666664444666644444666444444664444444644444444
// 015:4444444444444446444444664444466644446666444666664466666646666666
// 016:4444444464444444664444446664444466664444666664446666664466666664
// 017:4444444744444477444447774444777744477777447777774777777777777777
// 018:7444444477444444777444447777444477777444777777447777777477777777
// 019:7777777777777774777777447777744477774444777444447744444474444444
// 020:7777777747777777447777774447777744447777444447774444447744444447
// 021:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 022:666666666666666a666666aa66666aaa6666aaaa666aaaaa66aaaaaa6aaaaaaa
// 023:66666666a6666666aa666666aaa66666aaaa6666aaaaa666aaaaaa66aaaaaaa6
// 024:aaaaaaa6aaaaaa66aaaaa666aaaa6666aaa66666aa666666a666666666666666
// 025:6aaaaaaa66aaaaaa666aaaaa6666aaaa66666aaa666666aa6666666a66666666
// 026:aaaaaaa7aaaaaa77aaaaa777aaaa7777aaa77777aa777777a777777777777777
// 027:7aaaaaaa77aaaaaa777aaaaa7777aaaa77777aaa777777aa7777777a77777777
// 028:777777777777777a777777aa77777aaa7777aaaa777aaaaa77aaaaaa7aaaaaaa
// 029:77777777a7777777aa777777aaa77777aaaa7777aaaaa777aaaaaa77aaaaaaa7
// 030:6666666666776776677777767777777777777777777777777777777777777777
// 031:0000000800000008000000080000000800000008000000080000000888888888
// 032:000000000111111001ccccc00c1111100ccccc10011111c00cccccc000000000
// 033:5555555555666655556666555566665555666655555115555551155555555555
// 034:6666666666555566665555666655556666555566666116666661166666666666
// 035:555555555555555a555555aa55555aaa5555aaaa555aaaaa55aaaaaa5aaaaaaa
// 036:55555555a5555555aa555555aaa55555aaaa5555aaaaa555aaaaaa55aaaaaaa5
// 037:aaaaaaa5aaaaaa55aaaaa555aaaa5555aaa55555aa555555a555555555555555
// 038:5aaaaaaa55aaaaaa555aaaaa5555aaaa55555aaa555555aa5555555a55555555
// 039:5555555455555544555554445555444455544444554444445444444444444444
// 040:4555555544555555444555554444555544444555444444554444444544444444
// 041:4444444444444445444444554444455544445555444555554455555545555555
// 042:4444444454444444554444445554444455554444555554445555554455555554
// 043:666666666c505c60055005006656050760560607606600076060007066077006
// 044:5555555555555557555555775555577755557777555777775577777757777777
// </TILES>

// <SPRITES>
// 000:0ccc0000ccccc000ccccc000ccccc0000ccc0000000000000000000000000000
// 001:c000cccc00000ccc00000ccc00000cccc000cccccccccccccccccccccccccccc
// 002:0999000090009000900090009000900009990000000000000000000000000000
// 003:0000000090009000099900000990000000000000000000000000000000000000
// 004:0000000090009000090900000000000000000000000000000000000000000000
// 005:0000000090009000000000000000000000000000000000000000000000000000
// 006:0ccc0000ccccc000ccccc000ccccc0000ccc0000000000000000000000000000
// 007:000000000ccc00000ccc00000ccc000000000000000000000000000000000000
// 008:000000000cc000000cc000000000000000000000000000000000000000000000
// 009:000000000c000000000000000000000000000000000000000000000000000000
// 016:555555cd555555cd555555cd555555cd55000000500000000000000000000000
// 017:555555cd555555cd555555cd555555cd5555eeed5eeeeeefeeeeeeffffffffff
// 018:555555cd555555cd555555cd555555cd555555cd555555dd5cccccccdddddddd
// 019:440cc04440cc04440cc00000cccccccccccccccc0cc0000040cc0444440cc044
// 020:1111111111111111111111111110011111066011006666000666666006666660
// 021:0666666006666660066666600066660011022011110220111102201111033011
// 022:1113111111131111111311111113111111131111311311311333331111131111
// 023:00000cd000000cd000000cd000000cd000000cd000000cd000000cd000000cd0
// 024:0000222000022220022222202222222022222220022222200002222000002220
// 025:7ccccccc77cccccc777cccc77577777775577757c7555577c777777ccc7777cc
// 026:ccccccc77ccccc77777777777577775777555577c777777ccc7777cccccccccc
// 027:ccccccc7cccccc777cccc77777777757757775577755557cc777777ccc7777cc
// 028:333cc3333333cc3333333cc3333333cc333333cc33333cc33333cc33333cc333
// 032:4444444444440000444033334440222244402222444022224444000044444444
// 033:4440044400033044333223042222223022222230222222040002204444400444
// 034:4444444444444444444444444400004440222304402223044022230440222304
// 035:4022230440222304402223040222223002222230402223044403304444400444
// 036:4444444400004444222204442222044422220444333304440000444444444444
// 037:4440044444022000402222220322222203222222403223334403300044400444
// 038:4032220440322204403222044032220444000044444444444444444444444444
// 039:4440044444033044403222040322222003222220403222044032220440322204
// 048:000000000ffffff00fdffff00dddddd00edeeee00feffff00ffffff000000000
// 049:000000000ffffff00ffffdf00dddddd00eeeede00ffffef00ffffff000000000
// 050:000000000ffedff00fedddf00ffedff00ffedff00ffedff00ffedff000000000
// 051:000000000ffdeff00ffdeff00ffdeff00ffdeff00fdddef00ffdeff000000000
// 052:000000000ffffff00ffffff00ffffff00ffffff00ffffff00ffffff000000000
// 053:000000000dddddd00eeeeed00ffffde00ffddef00fdeeff00dddddd000000000
// 064:00000000000000000000000000000000000000000000000c00000ccc000ccccc
// 065:00000000000000000000000000c000000cc00000cccc0000ccccc000ccccc000
// 066:0000000000000000000000000000000000000000000c00000ccccc00cc0ccc00
// 080:00cccccc0ccccc00ccccc000ccccc000cccccc0c0ccccccc00cccccc0000cccc
// 081:cccccc0c0ccccc0c0cccccc00cccccccccccccccccccccccc000cccc0000cccc
// 082:cc00ccc0cc00ccc0ccc0cccc00ccccccccccccccccccccccccccc0ccccc0000c
// 083:0000000000000000c0000000cc000000ccc00000ccc00000ccc00000ccc00000
// 096:0000cccc000ccccc000ccccc000ccccc0000cccc00000ccc0000000000000000
// 097:0000cccc000ccccccccccccccccccc0ccccccccccc0ccccc00000ccc000000cc
// 098:ccc0000cccc000cccccccccccccccc00cccccc00cccccc00cccccc00ccccccc0
// 099:ccccc000cccccc00ccccccc000ccccc000ccccc000ccccc00cccccc0cccccc00
// 113:00000ccc000000cc0000000c0000000000000000000000000000000000000000
// 114:ccccccccccccccccc00ccccc000cccc00000cc00000000000000000000000000
// 115:cccc0000ccc00000c00000000000000000000000000000000000000000000000
// </SPRITES>

// <MAP>
// 000:202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020204010101010101010101010101010101010101010101010101010105020202020202020202020202020202020202020202020202020202020202020202020202020202020
// 001:2020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020e1e1e1202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020e1e1202020e1e1e1e120202020202020202020202020202020e1e1e12020401010101010101010101010101010101010101010101010101010101010502020202020e1e1e1e1202020202020202020202020202020202020e1e1e1e1e1e1202020e1e120
// 002:202020202020202020e1e1e1e1e1e1e1e120202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020e1e1e1e1e120202020202020e1e1e1e1e120202020202020202020202020e1e1e1e1e1e1e1202020202020202020401010101010101010101010101010101010101010101010101010101010101010105020202020202020202020202020e1e1e1e1e12020e1202020202020202020202020202020
// 003:20202020202020202020202020202020202020202020202020202020202020e1e1e1e1e1e120202020202020202020202020202020202020202020202020202020202020202020e1e1e1e1e120202020202020202020202020e1e1e1e1e1e1e1e120202020202020202020202020202020208030309020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202040101010101010101010101010101010101010101010101010101010101010101010101010105020202020202020e1e1e120202020202020202020202080303030303030303090202020
// 004:2020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020e1e1e1e1e1e1e120202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020208030f1303090202020202020202020202020202020202020202020204010101010101010101010101010101010101010101010101010101010106020202020202020202020202020202020e1e1e1e1e1e120202070101010101010105020202020202020202020202020202020202020208030303030303030303030202020
// 005:20202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020d0c0c0c0c0c0c0c0e020202020202020202020202020202020202020202020202020202020303030303030202020405020202020202020202020202020202020401010101010101010101010101010101010101010101010101010101010602020e1e1e120202020e1e1e1e1202020202020202020202020202070101010101010101010101010101010101010105020202020202080303030303030303030303020e120
// 006:20401050202020202020204010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101050202020c0c0c0c0c0c0c0c0c02020202020202020202020202020202020401010101010101010101030303030303020202010102020202020202020202020401010101010101010101010101010101010101010101010101010101010101010101010101010101010502022202020202020d0c0c0c0c0c0c0c0c0c0e0202020701010101010101010101010101010101010105020202020203030303030303030f1303030202020
// 007:2010101020202020202020101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101050202001c0c0c0c0c0c0c0f02020401010101010101010101010101010101010101010101010101030303030303020202002102020202020202020202020101010101010101010101010101010121012101210101010101010101010101010101010101010101010102020202020d0c0c0c0c0c0c0c0c0c0c0c0c0c0e020202020701010101010101010101010101010101010101010101030303030303030303030303020e120
// 008:201002102020202020202010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101050202020202020202020202040101010101010101010101010101010101010101010101010101030303030303020202010102020202020202020202020101010101010101010101010101012101210121010101010101010101010101010101010101010101010602020202020c0c0c0c0c0c0c0c0c0c0c0c0c0c0c020222020401010101010101010101010101010101010101010101030303030303030303030303020e120
// 009:2070106020202020202020701010101010101010101010602020202020202020202020202020202070101010101010101010101010101010101010101010101010101010101010101010105020202020202020202040101010101010101010101010101010101010106020202020202020b030303030302020207060202020202020202020202070101010101010101010101010101010101010101010101010101010101010101010101010101020202020202022202001c0c0c0c0c0c0c0c0c0c0c0c0c0f02020401010101010101010101010101010101010106020202020203030303030303030303030a0202020
// 010:20202020202020202020202020202020202020202020202020202020202020202020202020202020e170101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010106020202020202020202020303030303020202020202020202020202020202020202020202070101010101010101010101010101010101010101010101010101010101010101010202020e1e120202020202001c0c0c0c0c0c0c0f020202020204010101010101010101010101010101010101060202020202020303030303030303020202020202020
// 011:2020202020202020202020202020202020202020202020202020202020202020202020202020e1e1e1e17010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010602020202020202020202020202020202020202020202020203030303030202020202020202020202020202020202020202020207010101010101010101010101010101010101010101010101010101010101010105020202020e1e120202020202020202020202020e1e1e12020101010101010602020202020202020202020202020202020202030303030303030302020202020e120
// 012:2020202020202020202020202020202020202020e1e1e1e1e1e1e12020202020202020202020202020202070101010101010101010101010101010101010101010101010101010101010101010101010101010101010106020202020202020202020202020202020e1e1e1e1e1e1e120202030303030a0202020e12020202020202020202020202020202020202020202020202020202020202020202020202020202020202070101010101010101010502020202020e1e1e1e1e1e1e1e120202220202020204010101010106020202020202020202020202020202020e1e1e120b0303030303030302020202020e120
// 013:2020202020e1e1e1e1e1e120202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020207010101010101010101010101010101010101060202020202020202020202020202020202020202020202020202020b03030a020202020e1e12020202020e1e1e120202020202020202020202020202020202020202020202020202020202020202020202020701010101010101010502020202020202020202020202020204010101010101010106020202020202020202020202020202020202020202020b03030303030a020202020202020
// 014:2020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020701010101010101010101010101010101060202020202020202020202020202020202020202020202020202020202030a0202020202020e1e12020202020202020202020e1e1e12020202020202020202020202020202020e1e1e1e1202020202020202020207010101010101010101010101010101010101010101010101010101010101060202020202020202020e1e1e1202020e1e120202020202020202020202020202020202020e120
// 015:20202020202020202020202020202020202020202020202020202020202020202020e1e1e1e1e1e1e1202020202020202020202020e1e1e1e1e1e120202020e1e1e120202070101010101010101010101010101060202020202020e1e1e1e1e1e1e12020202020202020202020202020202020202020202020202020e1e120202020202020202020202020e1e1e120202020e1e1e120202020202020202020202020202020e1e1e1e1202020701010101010101010101010101010101010101010101010101010602020202020e1e1e1e12020202020202020202020202020202020e1e1e1e120202020202020202020
// 016:202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020701010101010101010101010101010101010602020202020202020202020202020202020202020202020202061515151515151515151515171202020202020
// 017:2020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020e1e1e1e1e1e1e1e12020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020401010101010101010101010101010101010202020202020202020202020202020202020202020202020202051515151515151515151515151202020202020
// 018:20202020202020202020202020202020202020202020202020202020202020202022202020202020202020202020202020202020202020222020202020202020202020202020202020202020202020202020202020206151515151518120202020202020202020222020202020202020202022202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202010101010101012101010101010101010101050202020202020202020202020e1e1e1e120202020222020202051515151515151515151515151202020202020
// 019:2020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202220202020202020202020202020202020202061515151515181202020202020202020202020202020202020202020202020202020202020e1e1e120202020202020202020202020202020202020202020e1e1e1e1e1e1e12020202020202020202020202020202020202020202040101010101010101010101010101010101010101010101010105020202020202020202020202020202020202051515151515151515151515151202020e12020
// 020:202020202020202020202020202020202020202020202020202020202020202020202020202020401010101010101010101010101010502020202020202020202020202020202020202020202020202020202020615151515151812020202020202020202020202080303030303030303030303030902020202020202020202020e1e1e1e1e1e1e1e1202020202020202020202020202020202020202020202020202020202020e1e1e1e1202020202010101010101010101010101010101010101010101010101010101010101010502020202020202020202020202051515151515151515151515181202020e12020
// 021:2020202020202020202020202020202020202020202020202020204010101010101010101010101010101010101010101010101010101010101010101010101010101050202020202020202220202020202020615151515151812020202020222020202080303030303030303030303030303030303020202020202020202020202020202020202020202020202020202020202020202020202020d0c0c0c0c0e020202020202020202020202020202010101010101010101010325151515151515151515151421010101010121010102020202020e1e1e1e1e1e1206151515151515151515151515120202020e12020
// 022:20401050202020202020202020202020202020202020401010101010101010101010101010101010101010101010101010101010101010101010101010101010101010105020202020202020202020202020615151515151812020202020202020202020303030303030303030303030303030303030202020202020202020202020202020202020202020202020202020202020202020202220d0c0c0c0c0c0c0c0e02020202020202020202020204010101010101010101010515151515151515151515151511010101010101010105020202020202020202020205151515151515151515151515120202220202020
// 023:20100210202020202020202020202020202020202020101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101050202020202020202020222061515151515181202020202020202020202020303030303030303030303030303030303030202020204050202020202020202020401010101010101010101010101010101010101010c0c0c0c0c0c0c0c0c0c0e0202020202020202040101010101010101010101010515151515151515151515151511010101010101010101020202020202220202020205151515151515151515151515120202020202020
// 024:20101010202020202020202020202020202020202020701010101010101010101010101010101010101010602020202020202020202020202020207010101010101010101010502020202020202020206151515151518120202020202020202020202020303030303030303030303030303030303030202020200210202020202020202020101010101010101010101010101010101010101010a2c0c0c0c0c0c0c0c0c092101010101010101010101010101010101010101010515151515151515151515151511010101010101010101050202020202020202020209151515151515151515151518120202020202020
// 025:207010602020202020202020202020202020202020202020202020701010101010101010101060202020202020202020202020202020202020202020701010101010101010101050202020615151515151515151518120202020202020204010101010103030303030303030303030303030303030302020202070602020202020202020201010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010515151515151515151515151511010101010101010101010101010101010101010101030303030303030303030303030303030309020
// 026:2020202020202020202020202020202020202020202020202020202020202020202020202020202020202061515151515151515151712020202020202070101010101010101010105020615151515151515151518120202020204010101010101010101030303030303030f1303030303030303030302020202020202020202020202020207010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010515151515151515151515151521010101010101010101010101010101010101010101030303030303030303030303030303030303020
// 027:202020202020202020202020202020202020202020202020202020202020202020222020202020202020615151515151515151515151515151515151515151515151515151515151515151515151515151515181202020204010101010101010101010103030303030303030303030303030303030302020202020202020202020202020202020202020202020207010101010101010101010101210101010101010101010101010101010101010101010101010101010101010625151515151515151521010101010101010101010101010101010101010101010101030303030303030303030303030303030303020
// 028:20202020202020202020202020202020202020202020202020202020202020202020202020202020615151515151515151515151515151515151515151515151515151515151515151515151515151518120202020401010101010101010101010101010303030303030303030303030303030303030202020e1e1e1e1e1202020202020202020202020202020202020202020202020202020202020202020701010101210101010101010101010101010101010101010101010121010101010101010101010101010101010101010101210101010101010101010101030303030303030303030303030303030303020
// 029:202020202020202020202020202020202020202020202020202020202020202020202020202061515151515151515151515151515151515151515151515151515151515151515151515151515181202020401010101010101010101010101010101010103030303030303030303030303030303030302020202020202020202020202020e1e1e1e12020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202030303030303030303030303030303030303020
// 030:202020202020202020202020202020202022202020202020202020202020e1e1e1e1e12061515151515151515151515151515151515151515151515151515151521010101010101010101010101010101010101010101010101010101010101010101060b03030303030303030303030303030303030202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020203030303030303030303030303030f130303020
// 031:2020202020e1e1e1e1e1e1202020202020202020202020202020202020202020202020615151515151515151515151515151515151515151515151515151515210101010101010101010101010101010101010101010101010101010101010106020202020202020202020b0303030303030303030a02020202020202020202020202020202020202020202020202020202020202020202020202020e1e1e1e1e12020202020202022202020202020202020202020202020202020202020e1e1e1e12020202020202020202020202020202020e1e1e1e1e1e12020222030303030303030303030303030303030303020
// 032:202020202020202020202020202020202020202020202020202020202020202020206151515151515151515151515151515151515151515151515151515152101010101010101210101010101210101010101010101010101010101010101060202020202020202220202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020e1e1e1e1e1e120202020202020202020202020202020e1e1e1e1e12020202020222020202020202020202020202020b0303030303030303030303030303030303020
// 033:202020202020202020202020202020202020202020202020202020202020202020615151515151515151515151515151515151515151515151515151515210101010101010101010101010101010101010101010101010101010101010106020202020202020202020202020202020202020202020222020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020b0303030303030a020
// 034:2020202020202020202020202020202020202020202020202020202020202020209151515151515151515151515151515151515151515151515151518120202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020e1e1e1e1e1e1e1e12020202020
// 035:202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202091515151515151515151515181202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020206151515151515151515151517120202020202020202020202020202020202020202020202020202020202020e1e1e1e12020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020e1e1e1202020202020202020e1e1e1e12020202020206151515151515151812020202020
// 036:202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020e1e1e1e1e120202020202020202020202020202020202020202020202020202020202020202020d0c0c0c0c0c0c0c0c0c0c0c0c0e020202020205151515151515151515151515120202020e1e1e1e1e1e120202020202020202020202020202020e1e1e1e120202020202020202020202020202020202020202020222020202020202020202022202020202020202020202020202020202020202020202020202020202020202020202020202020615151515151515181202020e1e120
// 037:20202020202020202020e1e1e1e1e1e1e1e1202020202020e1e1e1e1e1e1e1e120202020202020202020202020202020202020202020202020202020202020202020202020202020202020202220202020202020202020222020c0c0c0c0c0c0c0c0c0c0c0c0c0c020202020205151515151515151515151515120202020202020202020202020202020202040101010502020202020202020202020202020202022202020e1e1e1e1e1e1e1202020202020202020202020202020202020e1e1e1e1e1e1e1e1202020204010101010121010105020202020202020202220202061515151515151518120202020202020
// 038:2020202020202020202020202020202020202020202020202020202020202020202020202020e1e1e1e1e1e1e1202020202020202020202020202020e1e1e1e1e120202020202020202020202020202020202020202020202020c01130303030303030303021c0c02020e120205151515151515151515151515120202020202022202020202040101010101010101010102020202020202020202020202020202020202020202020202020202020202020202020d0c0e0202020202020202020202020202020202020401010101010101010101020202020202020202020206151515151515151812020e1e1e1e12020
// 039:20202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020e1e1e1e1e1e1e1e1e120202020202020202020d0c03030303030303030303030c0c02020e1202051515151515151515151515151202020405020202020202020101010101010101010101020202020202020202020202020202020202020202020202020202020202020202020d0c0c0c020e1e12020202020202020202020202020401010101010101010101010202020e1e1e1e1202020615151515151515181202020202020202020
// 040:2040105020202020202020202020401010101010101010101010101010101010502020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020c0c0303030f130303030303030c0c02020e1202051515151515151515151515151202020101020202020222020101010101010101010101020202220202020202020202020204010101010105020202020401010101050202020c0c0c0c0202020202020202040101010101010101010101010101010101010101020202020202020202061515151515151518120208030303030309020
// 041:2070026020202020202020202020101010101010101010101010101010101010101010101010101010101010101010101050202020202020202020202020202020202020202020202020202020202020202020202020202020c0c03030303030303030303030c0c02020e12020515151515151515151515151512020200210202020202020201010101010101010101010202020202020202020222020202010101010101010202020201010101010102020d0c0c0c0c0202020202020204010101010101010101010101010101010101010101020202020202020206151515151515151812020203030303030303020
// 042:2020202020202020202020202020101010101010101010101010101010101010101010101010101010101010101010101010101010101010101210101010101010101010101010101010101010101010502020202020202020c0c03030303030303030303030c0c02022e12020515151515151515151515151512020201010202020202020201010101010101010101010101010101010502020202020202010101010101010502020201010101010102020c0c0c0c0c0202020401010101010101010101010101010101010101010101010101020202020202020615151515151515181202020203030303030303020
// 043:2020202020202020202020202020701010101010101010101210101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101050202020c0c03030303030303030303030c0c02020e12020515151515151515151515151512020207060202020202020201010101010101010101010101010101010102020202020202010101010101010101010101010101010102020c0c0c0c0c020202010101010101010101010101010101010101010101010101010102020e1e1e12061515151515151518120202020203030303030303020
// 044:2020202020202020202020202020202020202020202020202020202022202070101010101010101010101010101010101210101010101010101010101010101010101010101010101010101010101010101010101060202020c0c03030303030303030303030c0c02020e12020515151515151515151515151512020202020202022202020201010101010101010101010101010101010102020202020202010101010101010101010101010101010102020c0c0c0c0f0202020101010121010101010101010101010101010101210101010101020202020206151515151515151812020202020803030303030303020
// 045:2020202020202020202020202020202020202020202020202020202020202020207010101010101010101010101010101010101010101010101010101010101010101010101010101010101010602020202020202020202020c0c03030303030303030303030c0c02020202020515151515151515151515151512020202020202020202020201010101010101010101010101010101010102020202020202010101010101010101010101010101010102020c0c0c0c020202020701010101010101010101010101010101010101010101010106020202020615151515151515181208030303030303030303030303020
// 046:2020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202220202020202020202020202020c0c04130303030303030303031c0c020202020205151515151515151515151515120202020e1e1e1e1e1e120201010101010101010101010101010101010102020202020202010101010101010101010101010101010102020c0c0c0c020202020202020202020202020202020202020202020202020202020202020202061515151515151518120203030303030303030303030303020
// 047:202020e1e1e1e1e1e1e1e1e1e120202020e1e1202020202020202020202020202020202020202020202020202020202020202020e1e1e1e1e12020202020202020202020202020202020202020202020202020202020202220c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0202020202051515151515151515151515151202020202020202020202020701010101010101010101010101010101060202020222020207010101010101010101010101010101060202001c0c0c020e1e1e1e120202020202020202020202020202020202020202020202020202061515151515151518120202030303030303030303030f1303020
// 048:20202020202020202020202020202020202020e1e1e1e1e1e1e1e1e1e12020202020202020202020202020202020202020202020202020202020202020202020e1e1e1e1e1202020202020202020e1e1e1e1e1e1e12020202001c0c0c0c0c0c0c0c0c0c0c0c0c0f020202020205151515151515151515151515120202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202001c0f02020202020202020202020202020202020202020202020202020e1e1e1202061515151515151518120b220203030303030303030303030303022
// 049:20202020202020202020202020202020202020202020202020202020202020202020202020202020e1e1e1e1e1e1e1e12020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202022202020202020202020202091515151515151515151515181202020202020202020202020202020202020202020202220202020202020202020202020202020e1e1e1e1e1e1202020202020202220202020202020202020202020202020202020e1e1e1e1e1e1e1e1e12020202020202020206151515151515151812020b2b220b03030303030303030303030a020
// 050:20202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020615151515151515181202020b2b2b22020202020202020202020202020
// 051:202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020615151515151515181202020202020202020202020202020202020202020
// 052:202020202020202020202020202020202020e1e1e1e1e1e1e1e1e120202020202020401010101010502020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020e1e1e1e1e1e1e12020202020202020202020202020202020202020202020202020206151515151515151812020202020803030303030303030309020e1e1e1e1e1
// 053:2020e1e1e1e1e1e120202020202020202020202020202020202020202020202020201010101010101050202020202020e1e1e1e1e1e1e1202020202020202020202020d0c0c0c0c0c0e02020202020202020202020202020202020e1e1e1e1e1e1e1e1e12020202020202020202020202020202020202020202020202020202020202020202020202020202020202220202020202020202020202020202020202020b2b2b2b2b22020202020202020202020202020202061515151515151515151515151712020202020202020202020615151515151515181202020202080303030303030303030303020d0c0c0c0e0
// 054:2020202020202020202020202020202020202020202020202020202020202020202010101010101010105020202020202020202020202020202020202020d0c0c0c0c0c0c0c0c0c0c0c02020202020202020202020202020202020202020202020202020202020401010502080303030303030309020202020202020222020e1e1e1e1e1e1e1e1e1202020202020202020202020202020e1e1e1e1e1e1e1202020202020b2b2b2b2b2202020202020202020202020206151515151515151515151515151515151515151515151515151515151515151518120202020208030303030303030303030303020c0c0c0c0c0
// 055:2020202020202020202020202020202020202020222022202220202020202020204010101010101010101050202020202020202020202020202020202020c0c0c0c0c0c0c0c0c0c0c0c0202020e1e1e1e1e1e1e12020202020202020202020202020202020202010101010203030303030303030302020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202061515181202020202020202020202091515151515151515151515151515151515181202020b220203030303030303030303030303020c0c0c0c0c0
// 056:2020401010502020202020202020202020202020202220222020202020202020401010101010101010101010101010101050202020202020202020202020c0c0c0c0c0c0c0c0c0c0c0c02020202020202020202020202020202020202020202020202020202040101010108030303030303030303020202020202020202020202020202020202020202020202020202020204010101010101010101010105020202020202020202020202020202020202020202061515181202020e1e1e1e1e1e1e12020202020202020202020202020202020202020202020b22020203030303030303030303030303020c0c0c0c0c0
// 057:2020101010102020202020202020202020202020222022202220202020202020101010101010101010101010101010101010202020202020202020202020c0c0c0c0c0c0c0c0c0c0c0c020202020202020202020202020202020e1e1e1e1e1e1e1e1e1e120201010101010303030303030f13030302020202020204050202020202020202020202020401010101010101010101010101010101010101010102020202020202220202020202020615151515151515151812020202020202020202020202020202020202020202020b2b2202020202020202020b220202030303030303030303030303030d0c0c0c0c0f0
// 058:2020100210102020202020e1e1e1e1e1e1202020202220222020202020202020101010101010101010101010101010101010202020202020202020202020c0c0c0c0c0c0c0c0c0c0c0c0202020202020202020202020202020202020202020202020202020201010101010303030303030303030302020202020201010202020b2b2b2b2b2b2202020101010101010101010101010101010101010101010102020202020202020202020202061515151515151515181202020202040101010101010101010101010101010502020b2b22020202020202020b2b220202030303030303030303030303030c0c0c0c0c020
// 059:2020101010102020202020202020202020202020202022202020202020202020701010101010101010101010101010101010202020202020202020202020c0c0c0c0c0c0c0c0c0c0c0c0101210101010101010105020202020202020202020202020202020201010101010303030303030303030302020202020200210202020b2b2b2b2b2b2202020101010101010101010101010101010101010101010602020222020202020202020206151515181202020202020202020204010101010121010101010101010121010102020b2b2202020202020b2b2b22020208030303030303030303030303030c0c0c0c0c020
// 060:202070101060202020202020202020202020202020222022202020202020202020701010101010101010101010101010101020202020e1e1e1e1e1e1202001c0c0c0c0c0c0c0c0c0c092101010101010101010101050202020202020202020202020202020201010101010b030303030303030303020202020202070602020202020202020202020207010101010101010101060202020202020202020202020202020b2b2b2b2202020615151518120202020202020202020401010101010101010101010101010101010102020b2b2202020202020b22020803030303030303030303030303030303001c0c0c0f020
// 061:202020202020202020202020202020202020202022202220222020202020202020202020202020202020202020207010101020202020202020202020202020202020202040101210101010101010101010101010101020202020202020202020202020202020701010106020b030303030303030a02020202020202020202020202020202020202020202020202020202020202020202020202020202020202020b2b2b2b2b2b2202061515151812020204010101010101010101010101010101010101010101010101010102020b2b2202020202020202020303030303030303030303030f1303030a020c0c0c02020
// 062:202020202020e1e1e1e1e1e12020202020202020202220222020202020202020d0c0c0c0c0c0c0c0e020202020202070101020202020202020202020202020202020202010101010101010101010101010101010101020202020202020202020202020202020202020202020202020202020202020202020202020202020202220202020202020202020202020202020202020202020202020202020202020202020202020202020615151518120202020101010101010101010101010101010101010101210101010101060202020b220202020202020202030303030303030303030303030303031c0c0c0c0c0e020
// 063:2020202020202020202020202020202020202020202020202020202020202020c0c0c0c0c0c0c0c0c0e02020202020207060202020202020202020202020202020202040101010101010101010101010101010101010202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020e1e1e1e1e1e1e1e12020202020202020202061515151812020b2202010101010101010101010101010101010101010101010101010602020202020202020202020202020303030303030303030303030303031c0c0c0c0c0c0c020
// 064:202020202020202020202020202020202020e1e1e1e1e1e12020202020202020c0c0c0c0c0c0c0c0c0c0c0c0c0e0202020202020202020202020202020202020401010101010101010101010101010101010101010602020202020e1e1e1e1e1e1e1e1e1202020202020202020e1e1e1e1e1e120202020202020202020202020202020e1e1e1e1e1e1e1e120202022202020202020202020202020202020202022202020202061515151812020b2b2202010101010101010101010101012101010101010101010101060202020202020202020202020202020b030303030303030303030303031c0c0c0c0c0c0c0c020
// 065:20202020202020202020202020202020202020202020202020202020202020d0c0c0c0c0c0c0c0c0c0c0c0c0c0c02020202020202020e1e1e1e1e1e1e120202010101010101010101010101010101010101010106020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020206151515181202020b2b22020101010101010101010101010101010602020b2b2b2b22020202020202020e1e1e1e1e1e12020202020202020202020202020202020c0c0c0c0c0c0c0c0c020
// 066:20202020202020202020202020202020202020202020202020202020202020c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0202020202020202020202020202020202020101010101010101010101010101010101010106020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020206151515181202020b2b22020207010101010101010101010101010602020b2b2b2b2b2b220202020202020202020202020202020e1e1e1e1e1e1e12020202020202001c0c0c0c0c0c0c0f020
// 067:20202020202020202020202020202020202020202020202020202020202020c0c0c0c0c0c0c0c0c0c0c0c0c0c0c02020202020202020202020202020202020207010101010101010101010101010101010106020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020206151515181202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020
// 068:2020202020202020202020202020202020202020202020202020615151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151517120202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0
// 069:20202022202020e1e1e1e1e1e1e1e1202020222020202020206151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151517120202020b2b2b2b2b2b2b220202020202020202020202020202020202020202020202020202020202220202020202020202020202020202020202020202020202020202220202020202020202020202020202020202020202020202020202020202020202020202020202020202020202022202020c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0
// 070:202020202020202020202020202020202020202020202020615151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515171202022202020b2b2b2b2b220202020e1e1e1e1e1e1e120202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0
// 071:202020202020202020202020202020202020e1e1e1e120615151515151515151515151515151515151812020202020202020209151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151517120202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020401010101010101010101010101010101010101010101050202020202020202020202020202020202020202220202020202020202020202020202020202020c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0
// 072:202020e1e1e1e1e120202020401010502020202020206151515151515151515151515151515151515120401010101010101050209151515151515151515151515151515151515151518120202020202020209151515151515151515151515151515151515151515151515151517120202020e1e1e1e1e1e12020202020202020202020202020202020202020202020202020202020e1e1e1e1e1e12020202020401010101010101010101010101010101010101010101010105020202020202020202020202020202020202020202020202020202020b2b2b2b2b2b220202020c0c0c0c0c0c01130303030303021c0c0
// 073:2020202020202020202020201010101020202020615151515151515151515151515151515151515151201010101010101010102020202020202020202020209151515151515151515120d0c0c0c0c0c0c0e020515151515151515151515151515151515151515151515151515151712020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020204010101010101010101010101010101010101010101010101010105020202020202020222020202020202020202020202020202020202020202020202020202020c0c0c0c0c0c03030303030303030c0c0
// 074:20202020202020202020204010021010202020615151515151515151515151515151515151515151512010101010101010101020b2202040101010101010502051515151515151515120c0c0c0c0c0c0c0c0205151515151515151515151515151515151515181202080303030303090202020222020202020202020202020202020e1e1e1e1e1e1e1e12020202020202020202020202020202022202020401010106020202020202020202020202020202020202020207010101050202020202020202020202020e1e1e1e1e1e1e1e1e120202020202020202020202020202001c0c0c0c0113030303030303030c0c0
// 075:20202020202020202020201010101060202061515151515151515151515151515151515151515151812010101010101010101020b2204010101010101010102051515151515151515120c0c0c0c0c0c0c0f0205151515151515151515151515151515151518120208030303030303030902020202020202020202020202020202020202020202020202020202020202020202020202020202020202020401010106020202020202020202020202020202020202020202020701010105020202020202020202020202020202020202020202020202020202020204010101010101010103030303030303030303030c0c0
// 076:20202020202020202020207010106020206151515151515151515151515151515151812020202020204010101010101010106020b220101010101010101010205151515151515181202001c0c0c0f020202020515151515151515151515151515151518120202020303030303030303030902020e1e1e120202020204050202020202020202020202020202022202020202020202020202020202020401010106020202020202020202020e1e1e1e1e1e1e1202020202020207010101050202020202020202020202020202020202020202020222020202020401010101010101010103030303030303030303030c0c0
// 077:20202020202220202020202020202020615151515151515151515151515151812020202020202020401010101010101010102020b2201010101010101010102051515151515151202020202020202020202020515151515151515151515151515151512020202020303030303030303030309020202020202020202010102020202020202020202020202020202020202020202020202020202020401010106020202020202020202020202020202020202020202020202020207010101050202020202020202020202020202020202020202020202020204010101010101010101010303030303030f130303030c0c0
// 078:202020202020202020202020202020615151515151515151515151515151512020401010101010101010101010101010101020b2b22010101010101010101020515151515151512040101010101010101050202020202020202091515151515151518120202020203030303030303030f130309020202220202020201010202020202020202020202020202020204010101010101010101010101010101060202020202022202020202020202020202020202020202020202020207010101050202020b2b2b2b22020b2b2b2b2b2b2b2b2b2b2202020204010101010101010101010103030303030303030303030c0c0
// 079:20202020202020e1e1e1e1e1e12061515151515151515151515151515151512020701010101010101010101010101010101020b2b22070101010101010106020515151515151512010101010101010101010204010101010502020515151515151812020202020203030303030303030303030309020202020202020021020202020202020202020202020202020101010101010101010101010101010602020202020202020202020202020202020202020202020202020202020207010101050202020202020202020202020202020202020202020401010106020202020202020203030303030303030303030c0c0
// 080:20202020202022202020202020615151515151515151515151515151515151712020202020202020207010101010101010602020202020202020202020202061515151515151512010101010101010101010207010101010602020515151515181202020202020203030303030303030303030303071202020202020101020202020202020202020202020202020701010101010101010101010101060202020202020202020202020202020202020202020202020202020202020202070101010502020202020202020202020202020202020202040101010602020202020202020203030303030303030303030c0c0
// 081:2020202020202020202020206151515151515151515151515151515151515151515151515151515171202020202020202020615151515151515151515151515151515151515151207010101010101010106020202020202020206151515151517120202020202080303030303030303030303030c1517120202020207060202020202020202020202020202020202020202020202020202020202020202020202020e1e1e1e1e1e12020202020202020222020202020202020202020202070101010101010101010101010101010101010101010101010106020202020222020202020b030303030303030303031c0c0
// 082:202020202020202020202061515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515171202020202020202020206151515151515151515151515151515151712020803030c1515151515151515151515151517120202020202020202020202020e1e1e1e1e1e1e1202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020701010101010101010101010101010101010101010101010602020202020202020202020202001c0c0c0c0c0c0c0c0c0c0
// 083:202020202020202020206151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151712020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020701010101010101010101010101010101010101010106020202020202020202020202220202001c0c0c0c0c0c0c0c0c0
// 084:20202020202020202061515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151712020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202001c0c0c0c0c0c0c0c0
// 085:202020202020202020515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515120202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020222020202020202020202020202020
// 086:202020202020202020515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515120202020202020202020202020202020202020202020204010101010101010101010101010101010101010101010101010101010101010105020202220202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020
// 087:20202020202020202051515151518120202020915151515151515151515151515151515151515151518120202020209151515151515151515151515151515151515151518120202020202020202020202020209151515151515151515151515151515151515151812020202091515151515151515151515151512020e1e1e1e12020202020202020202020202020202020101010101010101010101010101010101010101010101010101010101010101010102020202020202020222020202022202020202020202020202020e1e1e1e1e1e12020202020202020208030303030303030303030303030902020202020
// 088:202020202020202020515151518110101010101091515151515151515151515151515151515151518110101010101010915151515151515151515151515151515151518110101010101010101010101010101010915151515151515151515151515151515151811010101010109151812091515151515151515120202020202020202020202020202020202020202020207010101010101010101010101010101010101010101010101010101010101010106020202020222020202020202020202020202020202020222020202020202020202020202020222020203030303030303030303030303030302020202020
// 089:202020202020202020515151512010101010101020515151515151515151515151515151515151512010101010101010205151515151515151515151515151515151512010101010101010101010101010101010205151515151515151515151515151515151201010101010102020202020515151515151515120202020202020e1e1e1e1e1e1202020202020202020202020202020202020202020202020202020202020202020202020206151515181202020202020202020202020202020202020202020202020202020202020202020202020202020202020203030303030303030303030303030302020202020
// 090:2020202020202020205151515120101010101010205151515151515151515151515151515151515120101010101010102051515151515151515151515151515151515120101010101010101010101010101010102051515151515151515151515151515151812010101010101020202020205151515151515151202020202020202020202020202020202020202020202020e1e1e1e1e1e120202020202220202022202020202022202020615151518120222022202020222020202022202020202020202020202020202020202020401010101010101010101010103030303030303030303030303030302020b2b220
// 091:20405020202020202051515151201010101010106151515151515151515151515151515151515151201010101010101020515151515151515151515151515151515151711010101010101010101010101010101061515151515151515151515151515151812020101010101010617120202051515151515151512020405020b2b2202020202020202020202020202020202020202020202020202020202020202020202220202020202061515151812020202020202020202020202020202020202020202020222020202020202020101010101010101010101010103030303030303030303030303030302020b2b220
// 092:20101020202020202051515151201020202020205151515151515151515151515151515151515151201010101010101020202020202020915151515151515151515151517120202020201010101020202020206151515151515151515151515151515181202020c22020202020515120202051515151515151512020101020b2b22020202020202020202020b2b2b220202020202020202020202020202020202020202020202220206151515181202020202020202020202020202220202020202020202020202020202020202020101010101010101010101010103030303030303030303030303030302020b2b220
// 093:20021020202020202051515151201010101010109151515151515151515151515151515151515151201010101010101010101010101050205151515151515151515151515151515151201010101020515151515151515151515151515151515151518120202020303030303030918120202051515151515151512020021020b2b22020202020202020202020b2b2b220202020202020202020202020202020202220202020202061515151518120202022202020202022202020202020202022202020202020202020202020202020101010101010101010101010103030303030303030303030303030302020b2b220
// 094:2070602020202020205151515120101010101010202020202020202020209151515151515151515120701010101010101010101010106020515151515151515151515151515151515120101010102051515151515151515151515151515151515181202020202030303030f130303090202051515151515151512020101020b2b22020202020202020202020b2b2b220202020202020202020202020202020202020202020615151515151812020222020202220202020202020202020202020202020202020202020202020202020101010101010101010101010103030303030303030303030f13030302020b2b220
// 095:20202020202020202051515151201010101010101010101010101050202020915151515151515151202020701010101020202020202020615151515151515151515151515151515151201010101020515151515151515151515151515151515181202020202080303030303030303030902051515151515151512020706020b2b22020202020202020202020b2b2b22020202020e1e1e1e12020202220202020202061515151515151812020202020202020202020202220202020202020202020202020b2b220b2b2202020202020101010101010101010101010103030303030303030303030303030302020b2b220
// 096:20202020202020202051515151201010101010101010101010101010101050209151515151515151202020207010101020515151515151515151515151515151515151515151515151201010101020515151515151515151515151515151518120202020208030303030303030303030302051515151515151512020202020202020202020202020202020202020202020202020202020202020202020202061515151515151515181202020202022202020202020202020202022202020202020202020b2b220b2b2202020202020701010101010101010101010103030303030303030303030303030302020202020
// 097:2020202020202020205151515120101010101010101010101010101010101050615151515151515171202020202020206151515151515151515151515151515151515151515151515120101010102051515151515151515151515151515151202020202020b030303030303030303030a06151515151515151512020202020202020202020202020202020202020202020202020202020202020202061515151515151518120202020202022202020202220202220202020202020202022202020202020b2b220b2b2202020202020202020202020202020202020203030303030303030303030303030302020202020
// 098:20202020202020202051515151201010101010106151515151515151515151515151515151515151517120202020206151515151515151515151515151515151515151515151515151201010101020515151515151515151515151515151517120202020202020b030303030a0615151515151515151515151512020202020202020202020202020202020202020202020202020202020202020206151515151518120202020202020202020202020202020202020202020202020202020202020202020b2b220b2b220202022202020202020202020202022202020b030303030303030303030303030a02020202020
// 099:2020202020202020205151515171202020202061515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515171101010106151515151515151515151515151515151515151515151517120202020206151515151515151515151515151202020202020202020202020202020202020202020e1e1e1e1e12020204010101010101010101010101010101010101010101010101010101010101010101010101010105020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020
// 100:202020202020202020515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515171202061515151515151515151515151515151515151515151515151515151515151515151515151515151515151515120202020202020202020e1e1e1e12020202020202020202020202020207010101010101010101010101010101010101010101010101010101010101010101010101010106020202020202020202020202020202020202020202020e1e1e1e1e1e1e1202020202020202022202020e1e1e1e1e1202020
// 101:202020202020202020515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515120202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020
// 102:202020202020202020915151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515120202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020
// 103:2020202020202020202091515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515181202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020d0e02020202020202020202020202020202020202020202020202020202020202020222020202020202020202020
// 104:202020202022202020202091515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515181202020202020202020202020202020202020202020222020202020202020202020202020e1e1e1e1e1e1202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020e1e1e1e1e1e12020202020c0c0e02020202020202020202020202020202020e1e1e1e1e1e1e1e1202020202020202020202020202020222020
// 105:2020202020202020202020209151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515181202020202020202022202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020c0c0c020202020202220202020202020202020202020202020202020203030303030303030303030202020202020
// 106:20202020e1e1e1e1e1e120202091515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151518120202020202220202020202020208030303030303030303030302020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020c0c0c0e0202020202020202020202020202020202020202020202020303010101010101010103030202020202020
// 107:202020202020202020202020202091515151515151515151515151515151515151515151515151515151515151515151812020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020803030303030303030303030303030202020202020202020202020202020202020202020202020202020202020202020e1e1e1e1e1e1e1e12020202020202020e1e1e1e1e12020202020202020202220202020d0c0c0c0c0c0c0c0c0c0202020202020202020202020202220202020202020202020303010201010102010103030203020202020
// 108:20202220202020202020202020202091515151515151515151515151515151515151515151515151515151515151518120202020202020202020202020202020202020202020d0c0c0c0c0c0c0c0c0c0c0c0e0202020202020202020202020202020202020202020203030303030303030303030f13030302020202020202020202020202020202020202020202020202020222020202020202020202020202020202020202220202020202020202022202020202020202020202020c0c0c0c0c0c0c0c0c0c0e02020202020202020202020202020202020202020202020303010201010102010103030203020202020
// 109:20202020202020202020202020202020915151515151515151515151515151515151515151515151515151515151812020202020e1e1e1e1e1e1e12020202020202022202020c0c0c0c0c0c0c0c0c0c0c0c0f02020222020202020202020202220e1e1e1e12020202030303030303030303030303030303020202040502020202020b2b2b2b2b2b220202020202020202020202020202020202020202020202020202020202020202022202020202020202020202020202020202020c0c0c0c0c0c0c0c0c0c0c02020202020202020202020202020202020202220202020303010201010102010103030203020202020
// 110:2020e1e1e1e1e1e1e120202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020c0c0c0c0c0c0c0c0c0c0c0f0202020202020e1e1e1e1e1e1202020202020202020202030303030303030303030303030303020202010102020202020b2b2b2b2b2b220202020401010101010101010101010101010101010101010101050202020202020202020202020202020202020202020202020c0c0c0c0c0c0c0c0c0c0c0e020202020202020202020202020202020202020202020303010101010101010103030302020202020
// 111:20202020202020202020202022202020202020202020202020202020202020202020202020202020202020202020222020202020202020202020202020202020202020202020c0c0c0c0c0c0c0c0202020202020202020202020202020202020202020202220202020b0303030303030303030303030303020202002102020202020b2b2b2b2b2b220202020101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010105020c0c0c0c0c0c0c0c0c0c0c0c020202020222020401010101010101010101010101010303010101010101010103030202020202220
// 112:20202020202020202020202020202020202020202020202020222020202020202020e1e1e1e1e120202020202020202020202040101010101010101010101010101010502020c0c0c0c0c0c0c0c020202020202020202020202020202020202020202020202020d0c0c0e020b0303030303030303030303020202010102020202020b2b2b2b2b2b220202020701010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101020c0c0c0c0c0c0c0c0c0c0c0c0e0202020202020101010101010101010101010101010303030303030303030303030202020202020
// 113:202020202020202020202020202020e1e1e1e1e1e120202020202020202020202020202020202020202020202020202020204010101010101010101010101010101010102020c0c0c0c0c0c0c0c020202020202020401010101010101010101010101010101010c0c0c0c02020202020222020202020202020202070602020202020b2b2b2b2b2b220202020202020202020202020701010101010101010101010101010101010101010101010101010101010101010101010101020c0c0c0c0c0c0c0c0c0c0c0c0c0e0202020202070101010101010101010101010101030303010303030f130303030202020202020
// 114:2020204050202020202020202020202020202020202020202020202020202020202020202020202040101010101010101010101010101010101010101010101010101010202001c0c0c0c0c0c0f020202022202020101010101010101010101010101010101010c0c0c0c020202020202020b2b2b2b2b2202020202020202020202020202020202020202020202020202020202020202020207010101010101010101010101010101010101010101010101010101010101010106020c0c0c0c0c0c0c0c0c0c0c0c0c0c0e020202020202020202020202020202020202020303030301010103030303030202020202020
// 115:202020101020202220202020202020202020202020202020202020401010101010101010101010101010101010101010101010101010101010101010101010101010101020202001c0c0c0c0f02020202020202020701010101010101010101010101010101010c0c0c0c020202020b2b2b2b2b2b2b2b220202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202001c0c0c0c0c0c0c0c0c0c0c0c0c0c0202020202020202020202020202020222020203030303030303030303030302020e1e1e1e1
// 116:202020021020202020e1e1e1e120202020202020202020202020201010101010101010101010101010101010101010101010101010101010101010101010101010101060202020202020202020202020202020202020202020202020202020202020202020202001c0c0f02020222020202020202020202020202020202020202020202020202020202020e1e1e1e1e1e1e12020202020202020222020202020202020202020202020202020202020202020202020202020202020202020202020202020c0c0c0c0c0c0c0e0202020202020202020202020202020202020202030302020202030302020202020202020
// 117:20202070602020202020202020202020202022202020202020202070101010101010101010101010101010101010101010101010101010101010101010101010101060202020202020202020e1e1e1e1e1202020202020222020202020202020202020222020202020202020202020b2b2b2b2b2b2b2b220202020e1e1e1e120202020202020202020202020202020202020202020202020202020202020202020222020202020202022202020202022202020202020202020202220202020202020202001c0c0c0c0c0c0f0202020202020202022202020202020202020202020202020202020202020222020202020
// 118:2020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020e1e1e1e1e1e1e1e1e120202020202020202020202020
// 119:202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020
// 120:202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020101020202020202020202020202010102020202020202020202020202020202010102020202020201010202020202020202020202020202020202020101020202020202020202020202010102020202020202020202020202020202020201010101010101010101010101020202020202020202020202020202020202020202020202020202020202020202020202020
// 121:202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202022202020202020202020202020101010202020222020202020202010102020202020202020202020202220202010102020202020101020202020202020202020202020202020202020201010202020202020202020201010202020202020202020202020202020202020101010101010101210101010101010202020202020202020202020201010202020202020202020202010102020202020202020
// 122:e1e1e1e1e1202020202020202020202020202020202020202020e1e1e1e1e1e1e12020202020101010202020202020202010101020202020202020202020202020202020202020201010101010102020202020202020202020202020202020201010101020202020202020202020101020202022202020202020202020202020101020202020101020202020e1e1e1e1e1e1e1202020202020202020202010102020202020202020101020202020202020202020202020202020202020101010101010101010101010101010202020202020202020202020201010202020e1e1e1e1e1e120201010202020e1e1e1e120
// 123:2020202020202020202010101010101010101010202020202020202020202020202020202020101010202020202020202010101020202020202020202020202020202020202020101032515142101020202020202020202020202020202020201010201010202020e1e1e1e1e12010102020202020202020202020202020202010102020201010202020202020202020202020202020202020202020202020101020202020202010102020202020202020202020202020202020202020101010101010101010101010101010202020202020202020202020201010202020202020202020202010102020202020202020
// 124:202020202020202020201010101010101010101020202020202020202020202020202020202010101020e1e1e1e1e1e1201010102020202020202020b220202020202020202020101051515151101020202020202020e1e1e120e1e1e12020201010202010102020202020202020101020202020202020202020202020202020101020201010202020202020202020202020222020202220202020202020202010102020202010102020202020202020e1e1e1e1e1e1e1e1e1202020201010101072c0c0c0c0c08210101010202020202020202020202020201010202020202020222020202010102020202020202020
// 125:202020202020202020201010101010101010101020202020202020202020202020202020202010101020202020202020201010102020202020202020b2202020202020202020201010515151511010202020202020202020202020202020202010102020201010202020202020201010202020202020202020202020202020201010201010202020202020202220202020202020202020202020202020202020201010202010102020202020202020202020202020202020202020202010101010c0c0c0c0c0c0c010101210202020e1e1e1e1e1e1e1e120201010202020202020202020202010102020202020202020
// 126:2020202020202020202020101010021010101020202020202020202020202020202020202020101010101010101010101010101020202020202020b2b2b2202020e1e1e1e1e1201010515151511010202020202020202020202020202020202010102020202010102020202020201010202020202020202020202020202020201010101020202020202020202020202020202020202020202020222020202020202010101010202020202020202020202020202020202020202020202010121010c0c0c0c0c0c0c010101010202020202020202020202020201010202020202020202020202010102020202220202020
// 127:2020202020202020202020201010101010102020202020202020202020202020202020202020101010101010101010101010101020202020202020b2b2b2202020202020202020101062515152101020202020202020202020202020202020201010202020202010f120202022201010202020202020202020202020202020201002101020202020202020202020202020202022202020202020202020202020202020101020202020202020202020202020202020202020202020202010101010c0c0c0c0c0c0c010101010202020202020202020202020201010202020202020202020202010102020202020202020
// 128:202020202020202020202020201010101020202020202020202020202020202020202020202010101010101010101010101010102020e1e1e1e120b2b2b22020202020202020201010101010101010202020202020202020202020202020202010102020202020201010202020201010202020202020202020202220202020201010201010202020202020222020202020202020202020202020202020202020202020101020202020202020202020202020202020202020202020202010101010a2c0c0c0c0c09210101010202020202020202022202020201010202020202020202020202010102020202020202020
// 129:2020202020202020202020202010101010202020202020202020202020202020202020202020101010101010101010101010101020202020202020b2b2b2202020202020202020101010101010101020202020202020e1e1e1e1e1e1e1e1e1201010202022202020201010202020101020202020202020202020202020202020101020201010202020202020202020202020202020202022202020e1e1e1e1e1e1e12010102020202020202020202020b2b2b2b2b2b2b2b2b220202020101010101010101010101010101010202020202020202020202020201010222020202020202020202010102020202020202020
// 130:2020e1e1e1e1e1e1202020202010101010202020202020202020202020e1e1e1e1e1e120202010101020202020202020201010102020202020202020202020202020202020201010202020202020101020202020202020202020202020202020101020202020202020201010202010102020202020202020202020202020202010102020201010202020202020202020202020202020202020202020202020202020201010202020202020202020202020b2b2b2b2b2b2b2b2b2202020101010101010101010101010101010202020202020202020202020201010202020202020202020202010102020202020202020
// 131:202020202020202020202020201010101020202020202020202020202020202020202020202010101020e1e1e1e1e1e12010101020202020202020202020202020202020202010102020202020201010202020202020202020202020202020201010202020202020202020101020101020202020202020202020202020202020101020202020101020202020202020202220202020202020202020202020202020202010102020e1e1e1e1e1202020202020202020202020202020202010101010101010101010101010101020202020202020202020202020101020202020202020202220201010202020e1e1e1e120
// 132:2020202020202020202020202010101010202020202020202020202020202020202020202020101010202020202020202010101020202020202020202020202020202020201010202020202020202010102020202020202020202020202020201010202020e1e1e1e1e1e12010101010202020202020202020202020202220201010202020202010102020202022202020202020202020202020202220202020202020101020202020202020202020202020202020202020202020202010101010101010101012101010101020202020e1e1e1e1e1e1e120201010101010101010101010101010102020202020202020
// 133:20202020202020202020202020101010102020202020e1e1e1e1e12020202020202020202020101010202020202020202010101020202020202020202020202020202020201010202020202020202010102020202020222020202020222020201010202020202020202020202010101020202020202022202020202020202020101020202020202010102020202020202020202022202020202020202020202020202010102020202020202020202020202020202020202020202020202010101010101010101010101010202020202020202020202020202020101010101010f1101010101010202020202020202020
// 134:202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202010102020202020202020202010102020202020202020202020202020101020202020202020202020202010102020202020202020202020202020202010102020202020202010202020202020202020202020202020202020202020202020201010202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202220101010101010101010101020202020202020202020
// 135:202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202010102020202020202020202010102020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020202020
// </MAP>

// <WAVES>
// 000:00000000ffffffff00000000ffffffff
// 001:0123456789abcdeffedcba9876543210
// 002:014689aabbbbcdef012578abcccccdef
// 004:1469bdeffedbaaccaaa9985766554250
// 005:0000ffffffffffffffffffffffffffff
// 006:09ffffffffffff7f0000000000000000
// </WAVES>

// <SFX>
// 000:0000300040005000f000b000b000b000b000c000f000d000d000d000e000e000e000e000e000f000f000f000f000f000f000f000f000f000f000f000407000000000
// 001:03c0f300731083109320a330a340a340a330b320b330b330c330d330d320d330d340d330e320e320e310e310e320e320e310e310f310f310f310f300204000000000
// 002:00000000000000000000f000f000f000f000f000f000f000f000f000f000f000f000f000f000f000f000f000f000f000f000f000f000f000f000f000400000000000
// 003:8010601050106010702090309040a050a070a080b0a0b0c0c0c0c000d000d010d010d020d020d030d040d060d080e090e0b0e0c0e000e000e000f000300000000000
// 004:030063008300a300b300c300e300f300d300e300f300f300f300f300f300f300f300f300f300f300f300f300f300f300f300f300f300f300f300f300307000000000
// 005:10d720c63096406450535043603270218020801f901ea00da00db00cb00bc00bc00bd00ae00ae00af00af00af00af009e009e009e009f009f009f009102000000000
// 006:040024002400240024002400240024002400240024002400240024002400240024002400240024002400240024002400240024002400240024002400205000000000
// 007:0300b300c300d300d300d300d300d300d300e300e300f300f300f300f300f300f300f300f300f300f300f300f300f300f300f300f300f300f300f30060a000000000
// 008:03f063e063b07370834093209310a300b300b300c300d300d300e300e300f300f300f300f300f300f300f300f300f300f300f300f300f300f300f300385000000000
// 009:04f024a03460342034003400340034003400340034003400340034003400340034003400340034003400340034003400340034003400340034003400205000000000
// 010:210031003100314031403140317031703170410041004100410041005100510051005100610061006100610061007100710071007100810081008100405000000900
// 011:45c06500750085009500b500c500d500e500f500f500f500f500f500f500f500f500f500f500f500f500f500f500f500f500f500f500f500f500f500402000000000
// 012:000020002000200020002000200020002000200020003000300130023002300230023001300f300e300e300e300f300f3000300030003000400040004020000000bf
// 013:210031003100313031303130317031703170410041004100410041005100510051005100610061006100610061007100710071007100810081008100402000000900
// 014:a3f03100310031003140314031403170317041704100410041004100510051005100510061006100610061006100710071007100710081008100810020b000001900
// 015:45f06500750085009500b500c500d500e500f500f500f500f500f500f500f500f500f500f500f500f500f500f500f500f500f500f500f500f500f500308000070700
// 016:020002000200020002000200020002000200020002000200020002000200020002000200020002000200020002000200020002000200020002000200403000000000
// 017:010011001100110011002100210021c0310041004100410041004100510051005100510061006100710071008100810091009100a100b100b100c100403000006700
// 018:06c02600360046004600460046004600460046004600460046004600460046005600560056005600560056005600560056005600560056005600560030b000000000
// 019:000030004000500070009000b000e000f0007000800090009000a000b000c000d000e000f000f000b000b000c000d000d000e000f000f000f000f000304000000000
// 020:0300530063007300730073007300830083008300830083008300930093009300a300a300a300b300b300c300c300c300c300d300d300d300d300d300000000000000
// 021:0200020002000200f200f200f200f200f200f200f200f200f200f200f200f200f200f200f200f200f200f200f200f200f200f200f200f200f200f200000000000000
// </SFX>

// <PATTERNS>
// 000:cdd192000000c00064a00064000000a00092000000b00092c00092000000c00064a00064100000000000000000000000c00092000000c00064a00064000000a00092000000b00092c00092000000c00064a00064100000000000000000000000c00092000000c00064a00064000000a00092000000b00092c00092000000c00064a00064100000000000000000000000c00092000000c00064a00064000000a00092000000b00092c00092000000c00064a00064100000000000000000000000
// 001:d5517ed2217e8aa18cd2217ed5517ed2217e8aa18cd2217ed5517ed2217e8aa18cd2217ed5517ed2217e8aa18cd2217ed5517ed2217e8aa18cd2217ed5517ed2217e8aa18cd2217ed5517ed2217e8aa18cd2217ed5517e88818c8aa18cd2217ed5517ed2217e8aa18cd2217ed5517ed2217e8aa18cd2217ed5517ed2217e8aa18cd2217ed5517ed2217e8aa18cd2217ed5517ed2217e8aa18cd2217ed5517ed2217e8aa18cd2217ed5517ed2217e8aa18cd2217ed5517e88818c8aa18cd2217e
// 002:000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000cdd1a80000000551000dd100055100cdd1a8c000a8a000a800010071d1b6a291b67661b67921b87d11b6000000add1a8cdd1a80000000551000dd100055100cdd1a8c000a8a000a80001007d11b67921b87661b6a291b671d1b6000000000000
// 003:000000f06126c60126f771c6011100c771c6011100a771c6000000c000267000c67331287111267d01ba70d1bc7d01ba000000f06126c60126f771c6011100c771c60111005771c80000005000c86000c87331c800010071112a700028000000000000f06126c60126f771c6011100c771c6011100a771c6000000c000267000c67331287111267d01ba70d1bc7d01ba000000f06126c60126f771c6011100c771c60111005771c80000005000c86000c87331c800010071112a700028000000
// 004:500094000000500066f00064000000f00092000000e00092f00092000000f00064e00064000000a00092000000b00092c00092000000c00064a00064000000a00092000000b00092c00092000000c00064a00064100000000000000000000000500094000000500066f00064000000f00092000000e00092f00092000000f00064e00064000000a00092000000b00092c00092000000c00064a00064000000a00092000000b00092c00092c00062c00064a00064100000a00062000000b00062
// 005:5771c80111000771005000c69000c6c000c65000c8f000c6000000e000c6000000a721c60541007361c6018100c771c6cdd1a80000000551000dd100055100cdd1a8c000a8a000a85000a85000a80000007000a80000007000a80000000000005771c8011100077100f000c67000c85000c8f000c6c000c60000007000c6000000a721c60541009361c60181007771c6cdd1a80000000551000dd100055100cdd1a8c000a8a000a8c661c2c000c2c000c4a000c4000100a661c2000000b000c2
// 006:c661c2f06124c60124f771c4011100c771c4011100a771c4aaa104c00004700004700006000000711136700026700036000000a771c6a111c87771c67111c85771c65111c8f771c4f111c6e771c4e111c6f771c4f111c67771c67111c85771c60000000000000000000000000000000000000000000000000000000000000000000000000000005000c66000c67000c60000000000000000000000000000000000000000000000007441c27000c45000c25000c4f000c0f000c2a000c0b000c0
// 007:c00092000000c00064a00064000000a00092000000b00092c00092000000c00064a00064100000000000000000000000c00092000000c00064a00064000000a00092000000b00092c00092000000c00064a00064100000000000000000000000500094000000500066f00064000000f00092000000400094500094000000500066f00064000000500094000000600094700094000000900066700066000000700094000000600094700094700066500064500066f00062f00064a00062b00062
// 008:d5517ed2217e8aa18cd2217ed5517ed2217e8aa18cd2217ed5517ed2217e8aa18cd2217ed5517ed2217e8aa18cd2217ed5517ed2217e8aa18cd2217ed5517ed2217e8aa18cd2217ed5517ed2217e8aa18cd2217ed5517ed2217e8aa18cd2217ed5517e5dd1ea8aa18cd2217e5dd1ead2217e8aa18c5dd1ead5517e5dd1ea8aa18cd2217e5dd1ead2217e8aa18c5dd1ead5517e7dd1ea8aa18cd2217e7dd1ead2217e8aa18c7dd1ead5517ed2217e8aa18cd2217ed5517ed2217e8aa18cd2217e
// 009:c661c2f08124c60124f771c4011100c771c4011100a771c4aaa104c00004700004700006000000711136700026700036c661c2f06124c60124f771c4011100c771c40111005771c60000007000c67000f47000f67000f47000f67000f87000fa100000f701c4c000c4100000f071c4c000c4000100f771c4e000c4c000c40000005000c65111c652212850002a50002c000000f771c4e000c4a000c4000000c000c40000007000c4000000000000c441c2a000c2000100000000000000000000
// 010:c00092000000c00064a00064000000a00092000000b00092c00092000000c00064a00064100000000000000000000000c00092000000c00064a00064000000a00092000000b00092c00092000000c00064a00064100000000000000000000000c00092000000c00064a00064000000a00092000000b00092c00092000000c00064a00064100000000000000000000000c00092000000c00064a00064000000a00092000000b00092c00092000000c00064a00064100000000000000000000000
// 011:c55101000000c00003a00003000000a00001000000b00001c00001000000c00003a00003100000000000000000000000c00001000000c00003a00003000000a00001000000b00001c00001000000c00003a00003100000000000000000000000700003000000400005e00003000000500003000000600003700003000000400005e00003100000000000000000000000700005000000400007e00005000000500005000000600005700005000000400007e00005100000000000000000010300
// 012:fcc117000000acc119000000fcc119000000acc11900c000fcc11700c000acc1190cc000fcc1190cc000acc1190cc000fcc1170cc000acc1190cc000fcc1190cc000acc1190cc000fcc1170cc000acc1190cc000fcc1190cc000acc119000000fcc11700c000bcc1190c0000fcc1190cc000bcc1190cc000fcc1170cc000bcc1190cc000fcc1190cc000bcc1190c00005cc1190cc000dcc1190cc0005cc11b0cc000dcc11900c0008cc1190cc0005cc11b0cc0008cc11b0cc0005cc11b000000
// 013:fbb123000000f00023f00023fff18a000000abb123f00023000000a00023f00023000000fff18a000000abb1230000008bb123000000800023800023fff18a000000fbb123800023000000f00023800023000000fff18a000000abb123000000bbb123000000b00023b00023fff18a0000006bb125b00023000000600025b00023000000fff18a000000bbb123000000dbb123000000d00023d00023fff18a0000008bb125d00023000000800025d00023000000fff18a000000ebb123000000
// 014:000000f141c4000000a141c6000000f141c6000000a141c6000000f141c4000000a141c6000000f141c6010000a141c6014000f141c4010000a141c6010000f141c6010000a141c6010000f141c4014000a141c6014000f141c6014000a141c6014000f141c4014000b141c6014000f141c6014000b141c6014000f141c4014000b141c6014000f141c6014000b141c60140005141c6014000d141c60140005141c8014000d141c60140008141c60140005141c80140008141c80140005141c8
// 015:100000000000aaa107800007700007044100faa105500007700007044100faa105500007700007044100aaa107000000000000f00005000000000000000000000000a00005c00005a00005044100faa105500007f00005000000500007000000600007000000f00005500007600007044100faa1055000076000070441008aa107000000a00007000000800007000000000000600007500007000000000000f00005d00005000000000000000000800005000000a00005000000d00005000000
// 016:faa105044100aaa107800007700007000000f00007c00007a00007000000f000070000005000090000007000090000000000008000090000000000000776000000000000000000000331000006006aa109000000000000500009000000000000f00007000000077600000000000000000000600609000000000000a00009000000077600000000000000800609000000000000600009500009d00007500009800009d0000950000b000000057600000000000000044100000000000600000000
// 017:8991c60000000000007000c60000000000005000c60000000000007000c6000000000000000000f000c400000000000080c2c60000000000007000c6000000000000f000c4000000000000c000c4000000000000a000c4000000000000b000c4000000000000b472c4000000f372c4000000000000f382c4000000000000b472c6000000f372c6000000000000d472c600000000000000000085a2c68592c60000000000006592c65382c6000000000000000000000000000000000100000200
// 018:1991c0d472c6000000a592c60000000000008792c6000000000000a592c6000000000000000000f472c4000000000000d472c6000000000000a592c60000000000008792c6000000000000a592c6000000000000000000f472c40000006592c60000000000000000000000006472c6000000000000000000f382c4000000000000000000f372c4000000000000d592c4000000000000000000000000000000d5a2c4d592c48592c4000000000000000000000000000000033100000100000200
// 019:4ff194000000000000e000920000000000004000940000000551000221004ff192400092400092000000044100011100000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 020:87717e83317e4ff18c87717e83317e4ff18c40001c00000000000000000048818c44418c4aa18c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 021:4ff1aa000000000000e000a800000000000040b0aa0000000441000111004ff1a84000a84000a8000000044100011100000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 022:4551c64501c8b000c6e551c4e051c69000c64551c64000c84221c640c2c84331c64111c64331c6000000044100011100000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 023:c00092000000c00094a00094000000a00092000000b00092c00092022100000100cff190000000000000044100011100000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 024:cff1a8c000a8055100cff1a8055100aff1a8000000b000a8c000a8055100022100cff1a60d0000000000055100022100000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 025:87717e83317e4ff18c83317e87717e83317e4ff18c83317e87717e4aa18c4ff18c40001c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 026:c881c6022100c881c6a441c67881c8a000c8b000c8c000c80000000441000000004771c6000000000000022100011100000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 027:eff194055100000000dff194055100000000cff194000000055600000000000000000000000000000000044100011100000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 028:eff1d6044100000000dff1d6044100000000cff1d6000000000000000000000000000000000000000000044100011100000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 029:e771c6011100000000d771c6011100000000c771c6000000055600000000000000000000000000000000022100011100000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 030:9551c40111000000008551c40111000000007551c4000000055600000000000000000000000000000000022100011100000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
// 031:5dd192000000500064f00062000000f000900000004000925dd192000000500064f000620000001000000000000000005dd192000000500064f00062000000f000900000004000925dd192000000500064f000620000001000000000000000005dd192000000500064f00062000000f000900000004000925dd192000000500064f000620000001000000000000000005dd192000000500064f00062000000f000900000004000925dd192000000500064f00062000000100000000000000000
// 033:1881c0000000000000000000000000000000000000000000000000000000000000000000000000e771c6000000a000c6c000c6000000000000000000000000044100011100000100000000000000000000000000000000000000000000000000533126503128c30126503126530128c03126530126503128000000000000000000000000000000add1a8055100fdd1a65dd1a8000000000000000000000000000000000000044100011100000100000000000000000000000000000000000000
// 034:0000005771285000c8022100c771c6f000c65000c88000c80000007000c80000005000c8000000022100000100e771c6000000f000c6e000c6a000c6000000e000c6000000c000c60000000000005501b8f000b6000000c051b60000005000b80000005771285000c8a441c6c771c6f000c65000c88000c8000000a000c80000005000c8000000c000c6e000c6f000c6000000f000c6e000c6000000f000c67000c80000005000c8022100c551f6c000b8100000c551f6c000b8100000a000b6
// 035:000000f77107500009022100c77107f00007500009800009000000700009000000500009000000022100000100e77107000000f00007e00007a00007000000e00007000000c00007000000000000520138f02156520138f02156520138f02156000000577109055600a00607c00007f00007500009800009000000700009000000500009055600c00607e00007f00007000000f00007e00007000000f00007700009f00007500009022100c771070221000001000000008771c8022100a771c8
// 036:add192000000a00064800064000000800092000000900092add192000000a000648000640000001000000000000000005dd192000000500064f00062000000f000900000004000925dd192000000500064f00062000000100000000000000000add192000000a00064800064000000800092000000900092add192000000a00064800064000000100000000000000000cdd192000000e00064c00064000000c00092000000b00092c00062c00064a00062a00064800062800064700062700064
// 037:f5514d0000004aa18cf3314df5514d0000004aa18cf3314df5514d0000004aa18cf3314df5514d0000004aa18cf3314dd5517ed2217e8aa18cd2217ed5517ed2217e8aa18cd2217ed5517ed2217e8aa18cd2217ed5517ed2217e8aa18cd2217ef5514d0000004aa18cf3314df5514d0000004aa18cf3314df5514d0000004aa18cf3314df5514d0000004aa18cf3314dd5517ed2217e8aa18cd2217ed5517ed2217e8aa18cd2217ed5517ed2217e8aa18cd2217ed5517e87718c8aa18cd2217e
// 038:a771c80000000576000000000000000000000000000000000000000000000000000006000441008771c8022100c771c8022100a771c85000c8088100a0c2a80000000000008000a80000000000000000007000d80000008000a8000000a002c80771000000000576000000000000000000000000000000000000000000000000000000000000008006c8000000c000c8000000057600000000000000000000000000000600088100c0c2a8000000a000a80000008000a80000007000d8000000
// 039:1002c05771285000c8022100c771c6f000c65000c88000c80000007000c80000005000c8000000022100000100e771c6000000f000c6e000c6a000c6000000e000c6000000c000c60000000000005501b8f000b6000000c051b60000005000b80000005771285000c8a441c6c771c6f000c65000c88000c8000000a000c80000005000c8000000c000c6e000c6f000c6000000f000c6e000c6000000f000c67000c80000005000c8022100c551f6c000b8100000c551f6c000b8100000a000b6
// 040:a771c80000000576000000000000000000000000000000000000000000000000000006000441008771c8022100c771c8022100a771c85000c8088100a0c2a80000000000008000a80000000000000000007000d80000008000a8000000a002c80771000000000576000000000000000000000000000000000000000000000000000000000000008006c8000000c000c8000000057600000000000000000000000000000600088100c771c0c000c2a000c0a000c28000c08000c27000c07000c2
// 041:566105000000c00003e00003000000f00003044100011100000100000000000000000000000000f40153f04153f40153f66103022100c66103e00003000000f00003044100011100000100000000000000000000000000000000000000000000566105000000c00003e00003000000f00003044100011100000100000000000000000000000000f40153f04153f40153566105022100766105900005000000a00005044100011100000100000000000000000000000000000000000000010300
// </PATTERNS>

// <TRACKS>
// 000:180300180400580600180a00842700b80c00000000000000000000000000000000000000000000000000000000000000000070
// 001:d83f00d83f04d83f44d83f84d83fc4000000000000000000000000000000000000000000000000000000000000000000000040
// 002:4556d5000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020
// 003:856ad6000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060
// 004:c57ed7000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040
// 005:0a02200a03200a04205a97200a08200a04205a99200a0a20000000000000000000000000000000000000000000000000000060
// </TRACKS>

// <SCREEN>
// 000:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 001:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 002:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 003:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 004:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 005:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 006:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 007:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 008:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 009:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 010:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 011:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 012:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 013:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 014:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 015:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 016:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 017:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 018:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 019:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 020:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa44444444aa44444444aaaa444444aaaaaaaaaaaaaa44444444aaaa444444aaaa4444aaaaaaaa4444444444aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 021:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa444444441a444444441aaa4444441aaaaaaaaaaaaa444444441aaa4444441aaa44441aaaaaaa44444444441aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 022:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa14444111aa14444111a4444111144aaaaaaaaaa44441111111a4444111144aa44441aaaaaaa44441111111aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 023:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa44441aaaaa44441aaa44441aaa441aaaaaaaaa44441aaaaaaa44441aaa441a44441aaaaaaa44441aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 024:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa44441aaaaa44441aaa44441aaaa11aaaaaaaaa44441a4444aa44441aaa441a44441aaaaaaa44444444aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 025:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa44441aaaaa44441aaa44441aaaaaaaaaaaaaaa44441a44441a44441aaa441a44441aaaaaaa444444441aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 026:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa44441aaaaa44441aaa44441aaa44aaaaaaaaaa44441aa1441a44441aaa441a44441aaaaaaa444411111aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 027:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa44441aaaaa44441aaa44441aaa441aaaaaaaaa44441aaa441a44441aaa441a44441aaaaaaa44441aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 028:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa44441aaa44444444aaa1444444a11aaaaaaaaaa1444444441aa1444444a11a4444444444aa44441aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 029:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa44441aaa444444441aaa4444441aaaaaaaaaaaaa444444441aaa4444441aaa44444444441a44441aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 030:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1111aaaa11111111aaaa111111aaaaaaaaaaaaaa11111111aaaa111111aaaa1111111111aa1111aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 031:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 032:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 033:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 034:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 035:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 036:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 037:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 038:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 039:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 040:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 041:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 042:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 043:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 044:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 045:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 046:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 047:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 048:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 049:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 050:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 051:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 052:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 053:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 054:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 055:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 056:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 057:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 058:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 059:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaccaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 060:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaccaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabbbbaabbaaaaabbbaabbabaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 061:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaccaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabb11babb1aaabb11babb1b1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 062:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaccaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabb1ab1bb1aaabb1ab1bbbb1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 063:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaccaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabbbba1bb1aaabbbbb1abb11aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 064:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaccaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabb111abbbbbabb11b1abb1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 065:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaccaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa11aaaa11111a11aa1aa11aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 066:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaccaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 067:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 068:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabbaabaabbbaabaaabaaaaabbbbaabbbaaaaaabbbbaabbaaaaabbbaabbabaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 069:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabb1ab1bb11bab1bab1aaaaabb11bb11baaaaabb11babb1aaabb11babb1b1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 070:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabbbbb1bb1ab1bbbbb1aaaaabb1abb1ab1aaaabb1ab1bb1aaabb1ab1bbbb1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 071:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabb11b1bb1ab1bbbbb1aaaaabb1abb1ab1aaaabbbba1bb1aaabbbbb1abb11aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 072:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabb1ab1abbba1bb1bb1aaaaabb1aabbba1aaaabb111abbbbbabb11b1abb1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 073:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa11aa1aa111aa11a11aaaaaa11aaa111aaaaaa11aaaa11111a11aa1aa11aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 074:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 075:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 076:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 077:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 078:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 079:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 080:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 081:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 082:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 083:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 084:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 085:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 086:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 087:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 088:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 089:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 090:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 091:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 092:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 093:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 094:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 095:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 096:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 097:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 098:5aaaaaaaaaaaaaaaaaaaaaaaaaaaa77aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa55aaaaaaaaaaaaaaaaaaaaaaaaaaaa77aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa5
// 099:55aaaaaaaaaaaaaaaaaaaaaaaaaa7777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa5555aaaaaaaaaaaaaaaaaaaaaaaaaa7777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa55
// 100:5555aaaaaaaaaaaaaaaaaaaaaa77777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa55555555aaaaaaaaaaaaaaaaaaaaaa77777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa5555
// 101:555555aaaaaaaaaaaaaaaaaa777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa555555555555aaaaaaaaaaaaaaaaaa777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa555555
// 102:5555555aaaaaaaaaaaaaaaa77777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa55555555555555aaaaaaaaaaaaaaaa77777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa5555555
// 103:555555555aaaaaaaaaaaa777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa555555555555555555aaaaaaaaaaaa777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa555555555
// 104:5555555555aaaaaaaaaa77777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa55555555555555555555aaaaaaaaaa77777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa5555555555
// 105:555555555555aaaaaa777777777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa555555555555555555555555aaaaaa777777777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa555555555555
// 106:5555555555555aaaa77777777777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa55555555555555555555555555aaaa77777777777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa5555555555555
// 107:555555555555555777777777777777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa555555555555555555555555555555777777777777777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa555555555555555
// 108:55555555555555555777777777777777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa5555555555555555555555555555555555777777777777777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa55555555555555555
// 109:555555555555555555777777777777777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa555555555555555555555555555555555555777777777777777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa555555555555555555
// 110:55555555555555555555777777777777777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa5555555555555555555555555555555555555555777777777777777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa55555555555555555555
// 111:555555555555555555555777777777777777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa555555555555555555555555555555555555555555777777777777777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa555555555555555555555
// 112:55555555555555555555555777777777777777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa5555555555555555555555555555555555555555555555777777777777777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa55555555555555555555555
// 113:555555555555555555555555777777777777777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa555555555555555555555555555555555555555555555555777777777777777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa555555555555555555555555
// 114:55555555555555555555555555777777777777777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa5555555555555555555555555555555555555555555555555555777777777777777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa55555555555555555555555555
// 115:5555555555555555555555555555777777777777777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa55555555555555555555555555555555555555555555555555555555777777777777777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa5555555555555555555555555555
// 116:55555555555555555555555555555777777777777777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa5555555555555555555555555555555555555555555555555555555555777777777777777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa55555555555555555555555555555
// 117:5555555555555555555555555555555777777777777777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaa55555555555555555555555555555555555555555555555555555555555555777777777777777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaaaa5555555555555555555555555555555
// 118:55555555555555555555555555555555777777777777777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaa5555555555555555555555555555555555555555555555555555555555555555777777777777777777777777777777aaaaaaaaaaaaaaaaaaaaaaaaaa55555555555555555555555555555555
// 119:5555555555555555555555555555555555777777777777777777777777777777aaaaaaaaaaaaaaaaaaaaaa55555555555555555555555555555555555555555555555555555555555555555555777777777777777777777777777777aaaaaaaaaaaaaaaaaaaaaa5555555555555555555555555555555555
// 120:555555555555555555555555555555555555777777777777777777777777777777aaaaaaaaaaaaaaaaaa555555555555555555555555555555555555555555555555555555555555555555555555777777777777777777777777777777aaaaaaaaaaaaaaaaaa555555555555555555555555555555555555
// 121:5555555555555555555555555555555555555777777777777777777777777777777aaaaaaaaaaaaaaaa55555555555555555555555555555555555555555555555555555555555555555555555555777777777777777777777777777777aaaaaaaaaaaaaaaa5555555555555555555555555555555555555
// 122:555555555555555555555555555555555555555777777777777777777777777777777aaaaaaaaaaaa555555555555555555555555555555555555555555555555555555555555555555555555555555777777777777777777777777777777aaaaaaaaaaaa555555555555555555555555555555555555555
// 123:5555555555555555555555555555555555555555777777777777777777777777777777aaaaaaaaaa55555555555555555555555555555555555555555555555555555555555555555555555555555555777777777777777777777777777777aaaaaaaaaa5555555555555555555555555555555555555555
// 124:555555555555555555555555555555555555555555777777777777777777777777777777aaaaaa555555555555555555555555555555555555555555555555555555555555555555555555555555555555777777777777777777777777777777aaaaaa555555555555555555555555555555555555555555
// 125:5555555555555555555555555555555555555555555777777777777777777777777777777aaaa55555555555555555555555555555555555555555555555555555555555555555555555555555555555555777777777777777777777777777777aaaa5555555555555555555555555555555555555555555
// 126:555555555555555555555555555555555555555555555777777777777777777777777777777555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555777777777777777777777777777777555555555555555555555555555555555555555555555
// 127:555555555555555555555555555555555555555555555557777777777777777777777777755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555557777777777777777777777777755555555555555555555555555555555555555555555555
// 128:555555555555555555555555555555555555555555555555777777777777777777777777555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555777777777777777777777777555555555555555555555555555555555555555555555555
// 129:555555555555555555555555555555555555555555555555557777777777777777777755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555557777777777777777777755555555555555555555555555555555555555555555555555
// 130:555555555555555500555555555550055555555555555000055007777777777777777555555555555555555555555555555555555555555000555555555555555550055555555555005555005550055555555555555777000770077700777555555500555500550055555555555555555555555555555555
// 131:500505550000550000550005555550000550550055555005505557000077000077055005555555555555555555555555555555555555550055550005500005555550000555000050000050000050055550005550005550077700000700005550005500005555500000550000555550000550005500505555
// 132:500000505500505500500500555550055050550055555005505005007707007707055005555555555555555555555555555555555555500000500550500550555550055050550055005555005550055500500500550500000770077700550500500500550500550055500055555500055500550500000555
// 133:505050505500505500500055555550055055000055555005505005007707007705500005005005005555555555555555555555555555550055500550500555555550055050550055005555005550055500055500550550057770077700550500055500550500550055555000500500055500550505050555
// 134:505050550000550000550005555550000555550055555000055005000077000055555005005005005555555555555555555555555555550055550005500555555550000555000055500055500055000550005550005550055577000500550550005500005500555000500005500550000550005505050555
// 135:555555555555555555555555555555555555000555555555555555005557005555500055555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555557755555555555555555555555555555555555555555555555555555555555
// </SCREEN>

// <PALETTE>
// 000:1a1c2c5d275db13e53ef7d57ffcd75a7f07038b76425717929366f3b5dc941a6f673eff7f4f4f494b0c2566c86333c57
// </PALETTE>

