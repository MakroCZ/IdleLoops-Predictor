// ==UserScript==
// @name     Predictor Creator
// @version  1.1.2
// @description Author script for the predictor. To use: 1.call crUpdatePredictions in the console 2. copy the result into the script, replacing everything between the "CACHE File" markers 3. Fix any TODOs in the copied cache, those are actions that changed and (maybe) need attention, if a function shouldn't be in the output replace it with '' (or\`\`) 4. call crOutputPredictions 5. paste the output into the main script, replacing the content of the "predictions" object EXEPT those after "SPECIAL ACTIONS" those are special cases that should be done by hand  // @match https://lloyd-delacroix.github.io/omsi-loops/
// @author Tomnar <Tomnar#4672 on discord>
// @match https://lloyd-delacroix.github.io/omsi-loops/
// @grant    none
// ==/UserScript==

window.eval(`   

window.creatorCache={}

function crStripFunction(func) {
	if (!func) return "";
	                    //remove Spaces         //Replace \` with '  Replace $ with @
	func= func.toString().replace(/( |\\t)*/g,"").replace(/\`/g,"'").replace(/\\\$/g,"@");
	        //remove calls to 'finishProgress' 'unlockStory' and 'view.requestUpdate'
	func=func.replace(/towns\[[0-9]*\].finishProgress\(.*\);/g,"").replace(/unlockStory\(.*\);/g,"").replace(/view.requestUpdate\(.*\);/g,"");
	          //remove All comments     //remove newLines    remove base function boilerplate code
	return func.replace(/\\/\\/.*$/gm,"").replace(/\\n/g,"").replace(/(.*)\\(\\)\\{(.*)\\}/,"$2");
}

function crCheckCache(action,funcName, cacheName,cacheString,funcTemplate,isLoop=false) {
	let rObject={};
	rObject.txt=cacheString+"."+cacheName+"={};";
	rObject.toEdit=false;

	let cObject=creatorCache[action.name]
	let cacheExists= cObject!=undefined;

	if (cacheExists&&isLoop) {
		cObject=cObject.loop;
		cacheExists= cObject!=undefined;
	}
	if (cacheExists) {
        cObject= cObject[cacheName];
		cacheExists= cObject!=undefined;
	}

	if (funcName==="finish") {
		let hasFinish= typeof action.finish=="function";

		if (typeof action.skills=="object") {
			hasFinish=true;
			rObject.txt+=cacheString+"."+cacheName+".skills={};";
			for (sk in action.skills) {
				if (typeof action.skills[sk]=="function") {
					rObject.txt+="\t"+cacheString+"."+cacheName+".skills."+sk+"=\\\\\\\`"+action.skills[sk].toString().replace(/\`/g,"'").replace(/\\\$/g,"@")+"\\\\\\\`,";
					rObject.toEdit=cacheExists&&(rObject.toEdit|| (!cObject.skills) || crStripFunction(cObject.skills[sk])!=crStripFunction(action.skills[sk]));
				} else {
					rObject.txt+="\t"+cacheString+"."+cacheName+".skills."+sk+"="+action.skills[sk]+",";
					rObject.toEdit=cacheExists&&(rObject.toEdit|| (!cObject.skills) ||cObject.skills[sk]!=action.skills[sk]);
				}
			}
		}
		if (typeof action.cost=="function") {
			hasFinish=true;
			rObject.txt+=cacheString+"."+cacheName+".cost=\\\\\\\`"+action.cost.toString().replace(/\`/g,"'").replace(/\\\$/g,"@")+"\\\\\\\`;";
			rObject.toEdit=cacheExists&&(rObject.toEdit||crStripFunction(cObject.cost)!=crStripFunction(action.cost));
		}
		if (!hasFinish) {
			rObject.txt="";
			return rObject;
		}
	}
	rObject.txt+=cacheString+"."+cacheName+".game=\\\\\\\`"+action[funcName].toString().replace(/\`/g,"'").replace(/\\\$/g,"@")+"\\\\\\\`;";


	if (cacheExists) {
		//Entry exists in the cache
		if (rObject.toEdit||crStripFunction(cObject.game)!=crStripFunction(action[funcName])) { //Function changed from the cache
			rObject.toEdit=true;
			rObject.txt+=\`\n//TODO: Check validity\`;
		}
		rObject.txt+=cacheString+"."+cacheName+".pred=\\\\\\\`"+cObject.pred+"\\\\\\\`;";
	} else {
		if (crStripFunction(action[funcName])=="") {
			rObject.txt+=cacheString+"."+cacheName+".pred='';";
		} else if (!isLoop && Koviko.predictions[action.name]&&Koviko.predictions[action.name][cacheName]) {
			rObject.txt+=cacheString+"."+cacheName+".pred=\\\\\\\`"+Koviko.predictions[action.name][cacheName].toString().replace(/\`/g,"\\\\\\\`")+"\\\\\\\`;";
		} else if (isLoop &&(Koviko.predictions[action.name])&&(Koviko.predictions[action.name].loop)&&(Koviko.predictions[action.name].loop[cacheName])) {
			rObject.txt+=cacheString+"."+cacheName+".pred=\\\\\\\`"+Koviko.predictions[action.name].loop[cacheName].toString().replace(/\`/g,"\\\\\\\`")+"\\\\\\\`;";
		} else if (isLoop &&(Koviko.predictions[action.name])&&(Koviko.predictions[action.name].loop)&&(Koviko.predictions[action.name].loop.effect)&&(Koviko.predictions[action.name].loop.effect[cacheName])) {
			rObject.txt+=cacheString+"."+cacheName+".pred=\\\\\\\`"+Koviko.predictions[action.name].loop.effect[cacheName].toString().replace(/\`/g,"\\\\\\\`")+"\\\\\\\`;";
		} else {
			rObject.toEdit=true;
			rObject.txt+=cacheString+"."+cacheName+".pred=\\\\\\\`"+funcTemplate+"\\\\\\\`;";
		}

	}
    return rObject;
}


function crOutputPredictions() {
	let output="";
	for (let act in Action ) {

		//Special Cases
		if (Action[act].name.startsWith("Survey")) {
			continue;
		}
		if (Action[act].name.startsWith("AssassinZ")) {
			continue;
		}
		let itemCache=creatorCache[Action[act].name];
		if (!itemCache) {
			console.log("Error, action not found?");
		}
		output+=\`\n        '\`+Action[act].name+\`':{ affected:['\`+itemCache.affected.toString().replace(/,/g,"','")+"']";
		if (itemCache.manaCost && itemCache.manaCost.pred) {
			output+=\`, manaCost:\`+itemCache.manaCost.pred;
		}
		if (itemCache.canStart && itemCache.canStart.pred) {
			output+=\`,\n          canStart:\`+itemCache.canStart.pred;
		}
		if (itemCache.effect && itemCache.effect.pred) {
			output+=\`,\n          effect:\`+itemCache.effect.pred;
		}
		if (itemCache.loop) {
			output+=\`, loop: {\`;
			if (itemCache.loop.max) {
				output+=\`\n          max:\`+itemCache.loop.max+",";
			}
			if (itemCache.loop.cost) {
				output+=\`\n          cost:\`+itemCache.loop.cost.pred+",";
			}
			if (itemCache.loop.tick) {
				output+=\`\n          tick:\`+itemCache.loop.tick.pred+",";
			}
			output+=\`\n          effect:{\`;
			let needsDiv=false
			if (itemCache.loop.end&&itemCache.loop.end.pred) {
				needsDiv?output+=", ":needsDiv=true;
				output+=\` end:\`+itemCache.loop.end.pred;
			}
			if (itemCache.loop.segment&&itemCache.loop.segment.pred) {
				needsDiv?output+=", ":needsDiv=true;
				output+=\`segment:\`+itemCache.loop.segment.pred;
			}
			if (itemCache.loop.loop && itemCache.loop.loop.pred) {
				needsDiv?output+=", ":needsDiv=true;
				output+=\`loop:\`+itemCache.loop.loop.pred;
			}
			output+=\`}\n        }\`;
		}
		output+="},";
	}
	console.log(output);
}



function crUpdatePredictions() {
	let output="";
	let rObject;
	let editCount=0;

	for (let act in Action ) {

		//skip some special Actions
		if (Action[act].name.startsWith("Survey")) {
			continue;
		}
		if (Action[act].name.startsWith("AssassinZ")) {
			continue;
		}


		let toEdit=false;
		let cacheString=\`\ncreatorCache['\`+Action[act].name+\`']\`;
		let item=cacheString+"={};";
		

		if (creatorCache[Action[act].name] && creatorCache[Action[act].name].affected) {
			item+=cacheString+".affected=['"+creatorCache[Action[act].name].affected.toString().replace(/,/g,"','")+"'];"; 
		} else if (Koviko.predictions[Action[act].name] &&Koviko.predictions[Action[act].name].affected){
			item+=cacheString+".affected=['"+Koviko.predictions[Action[act].name].affected.toString().replace(/,/g,"','")+"'];"; 
		} else {
			item+=cacheString+".affected=[];"
		}

		if ((typeof Action[act].manaCost=="function")&&isNaN(crStripFunction(Action[act].manaCost).replace(/return([0-9]*);/,"$1"))) {//if manaCost is numeric don't cache it
			rObject=crCheckCache(Action[act],"manaCost", "manaCost",cacheString,\`(r,k) => {\n//TODO: Add function\n        }\`)
			item+=rObject.txt;
			toEdit=toEdit||rObject.toEdit;
		}
		if(typeof Action[act].canStart=="function") {
			rObject=crCheckCache(Action[act],"canStart", "canStart",cacheString,\`(input) => {\n//TODO: Add function\n        }\`)
			item+=rObject.txt;
			toEdit=toEdit||rObject.toEdit;
		}

		if(Action[act].type=="multipart") {
			cacheString+=".loop";
			item+=cacheString+"={};";
			if(typeof Action[act].loopCost=="function") {
				rObject=crCheckCache(Action[act],"loopCost", "cost",cacheString,\`(p) => segment =>  precision3(Math.pow(1.2, p.completed + segment)) //TODO: Add function\`,true)
				item+=rObject.txt;
				toEdit=toEdit||rObject.toEdit;
			}
			if(typeof Action[act].tickProgress=="function") {
				rObject=crCheckCache(Action[act],"tickProgress", "tick",cacheString,\`(p, a, s, k, r) => offset => h.getStatProgress(p, a, s, offset) * Math.sqrt(1 + p.total / 1000) //TODO: Add function\`,true)
				item+=rObject.txt;
				toEdit=toEdit||rObject.toEdit;
			}

			if(typeof Action[act].finish=="function") {
				rObject=crCheckCache(Action[act],"finish", "end",cacheString,\`(r,k) => {/*TODO: Add function*/}\`,true)
				item+=rObject.txt;
				toEdit=toEdit||rObject.toEdit;
			}
			if(typeof Action[act].segmentFinished=="function") {
				rObject=crCheckCache(Action[act],"segmentFinished", "segment",cacheString,\`(r,k) => {/*TODO: Add function*/}\`,true)
				item+=rObject.txt;
				toEdit=toEdit||rObject.toEdit;
			}
			if(typeof Action[act].loopsFinished=="function") {
				rObject=crCheckCache(Action[act],"loopsFinished", "loop",cacheString,\`(r,k) => {/*TODO: Add function*/}\`,true)
				item+=rObject.txt;
				toEdit=toEdit||rObject.toEdit;
			}

			//loop.max
			if (creatorCache[Action[act].name] && creatorCache[Action[act].name].loop  && creatorCache[Action[act].name].loop.max!=undefined ) {
				item+=cacheString+".max=\\\\\\\`"+creatorCache[Action[act].name].loop.max+"\\\\\\\`;";
			}else if ((Koviko.predictions[Action[act].name])&&(Koviko.predictions[Action[act].name].loop)&&(Koviko.predictions[Action[act].name].loop.max)) {
					item+=cacheString+".max=\\\\\\\`"+Koviko.predictions[Action[act].name].loop.max.toString().replace(/\`/g,"\\\\\\\`")+"\\\\\\\`;";
			} else if (toEdit) {
				item+=cacheString+".max=\\\\\\\`()=>1 //TODO: check if cap relevant, replace with empty String otherwise\\\\\\\`;"; 
			}
		} else {
			//For multipart actions the effect is stored inside the loop object
			rObject=crCheckCache(Action[act],"finish", "effect",cacheString,\`(r,k) => {\n//TODO: Add function\n        }\`);
			item+=rObject.txt;
			toEdit=toEdit||rObject.toEdit;
		}

		if (toEdit) {
			editCount++;
		}
		output+=item;
	}
	console.log(output);
	if (editCount>0) {
		console.log(editCount+" Actions require updates");
	} else {
		console.log("All actions are up to date, use crOutputPredictions() to generate a usable prediction String for the Predictor");
	}
}

//CACHE File



creatorCache['RuinsZ1']={};
creatorCache['RuinsZ1'].affected=[''];
creatorCache['RuinsZ1'].effect={};
creatorCache['RuinsZ1'].effect.game=\`finish() {
            towns[this.townNum].finishProgress(this.varName, 1);
            adjustRocks(this.townNum);
        }\`;
creatorCache['RuinsZ1'].effect.pred=\`\`;
creatorCache['RuinsZ3']={};
creatorCache['RuinsZ3'].affected=[''];
creatorCache['RuinsZ3'].effect={};
creatorCache['RuinsZ3'].effect.game=\`finish() {
            towns[this.townNum].finishProgress(this.varName, 1);
            adjustRocks(this.townNum);
        }\`;
creatorCache['RuinsZ3'].effect.pred=\`\`;
creatorCache['RuinsZ5']={};
creatorCache['RuinsZ5'].affected=[''];
creatorCache['RuinsZ5'].effect={};
creatorCache['RuinsZ5'].effect.game=\`finish() {
            towns[this.townNum].finishProgress(this.varName, 1);
            adjustRocks(this.townNum);
        }\`;
creatorCache['RuinsZ5'].effect.pred=\`\`;
creatorCache['RuinsZ6']={};
creatorCache['RuinsZ6'].affected=[''];
creatorCache['RuinsZ6'].effect={};
creatorCache['RuinsZ6'].effect.game=\`finish() {
            towns[this.townNum].finishProgress(this.varName, 1);
            adjustRocks(this.townNum);
        }\`;
creatorCache['RuinsZ6'].effect.pred=\`\`;
creatorCache['HaulZ1']={};
creatorCache['HaulZ1'].affected=['stone'];
creatorCache['HaulZ1'].canStart={};
creatorCache['HaulZ1'].canStart.game=\`canStart() {
            return !resources.stone && stonesUsed[this.townNum] < 250;
        }\`;
creatorCache['HaulZ1'].canStart.pred=\`(input)=>((input.stone||0)<1 && stonesUsed[1] < 250)\`;
creatorCache['HaulZ1'].effect={};
creatorCache['HaulZ1'].effect.game=\`finish() {
            stoneLoc = this.townNum;
            towns[this.townNum].finishRegular(this.varName, 1000, () => {
                addResource("stone", true);
            });
        }\`;
creatorCache['HaulZ1'].effect.pred=\`(r) => {
          let t=towns[1]; //Area of the Action
          if (t.goodStonesZ1>0) {
            r.stone=1;
            return;
          }
          if (t.totalStonesZ1<=(t.checkedStonesZ1+(r.stoneCheckedZ1||0))) {
            return; //No more stones to check..
          }
          r.stoneCheckedZ1=(r.stoneCheckedZ1||0)+1;
          if (((t.checkedStonesZ1+r.stoneCheckedZ1)%1000)==0) {
            r.stone=1;
          }
        }\`;
creatorCache['HaulZ3']={};
creatorCache['HaulZ3'].affected=['stone'];
creatorCache['HaulZ3'].canStart={};
creatorCache['HaulZ3'].canStart.game=\`canStart() {
            return !resources.stone && stonesUsed[this.townNum] < 250;
        }\`;
creatorCache['HaulZ3'].canStart.pred=\`(input)=>((input.stone||0)<1 && stonesUsed[3] < 250)\`;
creatorCache['HaulZ3'].effect={};
creatorCache['HaulZ3'].effect.game=\`finish() {
            stoneLoc = this.townNum;
            towns[this.townNum].finishRegular(this.varName, 1000, () => {
                addResource("stone", true);
            });
        }\`;
creatorCache['HaulZ3'].effect.pred=\`(r) => {
          let t=towns[3]; //Area of the Action
          if (t.goodStonesZ3>0) {
            r.stone=1;
            return;
          }
          if (t.totalStonesZ3<=(t.checkedStonesZ3+(r.stoneCheckedZ3||0))) {
            return; //No more stones to check..
          }
          r.stoneCheckedZ3=(r.stoneCheckedZ3||0)+1;
          if (((t.checkedStonesZ3+r.stoneCheckedZ3)%1000)==0) {
            r.stone=1;
          }
        }\`;
creatorCache['HaulZ5']={};
creatorCache['HaulZ5'].affected=['stone'];
creatorCache['HaulZ5'].canStart={};
creatorCache['HaulZ5'].canStart.game=\`canStart() {
            return !resources.stone && stonesUsed[this.townNum] < 250;
        }\`;
creatorCache['HaulZ5'].canStart.pred=\`(input)=>((input.stone||0)<1 && stonesUsed[5] < 250)\`;
creatorCache['HaulZ5'].effect={};
creatorCache['HaulZ5'].effect.game=\`finish() {
            stoneLoc = this.townNum;
            towns[this.townNum].finishRegular(this.varName, 1000, () => {
                addResource("stone", true);
            });
        }\`;
creatorCache['HaulZ5'].effect.pred=\`(r) => {
          let t=towns[5]; //Area of the Action
          if (t.goodStonesZ5>0) {
            r.stone=1;
            return;
          }
          if (t.totalStonesZ5<=(t.checkedStonesZ5+(r.stoneCheckedZ5||0))) {
            return; //No more stones to check..
          }
          r.stoneCheckedZ5=(r.stoneCheckedZ5||0)+1;
          if (((t.checkedStonesZ5+r.stoneCheckedZ5)%1000)==0) {
            r.stone=1;
          }
        }\`;
creatorCache['HaulZ6']={};
creatorCache['HaulZ6'].affected=['stone'];
creatorCache['HaulZ6'].canStart={};
creatorCache['HaulZ6'].canStart.game=\`canStart() {
            return !resources.stone && stonesUsed[this.townNum] < 250;
        }\`;
creatorCache['HaulZ6'].canStart.pred=\`(input)=>((input.stone||0)<1 && stonesUsed[6] < 250)\`;
creatorCache['HaulZ6'].effect={};
creatorCache['HaulZ6'].effect.game=\`finish() {
            stoneLoc = this.townNum;
            towns[this.townNum].finishRegular(this.varName, 1000, () => {
                addResource("stone", true);
            });
        }\`;
creatorCache['HaulZ6'].effect.pred=\`(r) => {
          let t=towns[6]; //Area of the Action
          if (t.goodStonesZ6>0) {
            r.stone=1;
            return;
          }
          if (t.totalStonesZ6<=(t.checkedStonesZ3+(r.stoneCheckedZ6||0))) {
            return; //No more stones to check..
          }
          r.stoneCheckedZ6=(r.stoneCheckedZ6||0)+1;
          if (((t.checkedStonesZ6+r.stoneCheckedZ6)%1000)==0) {
            r.stone=1;
          }
        }\`;
creatorCache['Map']={};
creatorCache['Map'].affected=['gold','map'];
creatorCache['Map'].canStart={};
creatorCache['Map'].canStart.game=\`canStart() {
        return resources.gold >= 15;
    }\`;
creatorCache['Map'].canStart.pred=\`(input)=>(input.gold>=15)\`;
creatorCache['Map'].effect={};
creatorCache['Map'].effect.game=\`finish() {
        addResource("gold", -this.goldCost());
        addResource("map", 1);
    }\`;
creatorCache['Map'].effect.pred=\`(r)=>(r.map++,r.gold-=15)\`;
creatorCache['Wander']={};
creatorCache['Wander'].affected=[''];
creatorCache['Wander'].effect={};
creatorCache['Wander'].effect.game=\`finish() {
        towns[0].finishProgress(this.varName, 200 * (resources.glasses ? 4 : 1));
    }\`;
creatorCache['Wander'].effect.pred=\`\`;
creatorCache['Smash Pots']={};
creatorCache['Smash Pots'].affected=['mana'];
creatorCache['Smash Pots'].manaCost={};
creatorCache['Smash Pots'].manaCost.game=\`manaCost() {
        return Math.ceil(50 * getSkillBonus("Practical"));
    }\`;
creatorCache['Smash Pots'].manaCost.pred=\`\`;
creatorCache['Smash Pots'].effect={};
creatorCache['Smash Pots'].effect.game=\`finish() {
        towns[0].finishRegular(this.varName, 10, () => {
            const manaGain = this.goldCost();
            addMana(manaGain);
            return manaGain;
        });
    }\`;
creatorCache['Smash Pots'].effect.pred=\`(r) => {
          r.temp1 = (r.temp1 || 0) + 1;
          r.mana += r.temp1 <= towns[0].goodPots ?  Action.SmashPots.goldCost() : 0;
        }\`;
creatorCache['Pick Locks']={};
creatorCache['Pick Locks'].affected=['gold'];
creatorCache['Pick Locks'].effect={};
creatorCache['Pick Locks'].effect.game=\`finish() {
        towns[0].finishRegular(this.varName, 10, () => {
            const goldGain = this.goldCost();
            addResource("gold", goldGain);
            return goldGain;
        });
    }\`;
creatorCache['Pick Locks'].effect.pred=\`(r) => {
          r.temp2 = (r.temp2 || 0) + 1;
          r.gold += r.temp2 <= towns[0].goodLocks ?  Action.PickLocks.goldCost() : 0;
        }\`;
creatorCache['Buy Glasses']={};
creatorCache['Buy Glasses'].affected=['gold','glassess'];
creatorCache['Buy Glasses'].canStart={};
creatorCache['Buy Glasses'].canStart.game=\`canStart() {
        return resources.gold >= 10;
    }\`;
creatorCache['Buy Glasses'].canStart.pred=\`(r)=>(r.gold>=10)\`;
creatorCache['Buy Glasses'].effect={};
creatorCache['Buy Glasses'].effect.cost=\`cost() {
        addResource("gold", -10);
    }\`;
creatorCache['Buy Glasses'].effect.game=\`finish() {
        addResource("glasses", true);
    }\`;
creatorCache['Buy Glasses'].effect.pred=\`(r) => (r.gold -= 10, r.glasses = true)\`;
creatorCache['Found Glasses']={};
creatorCache['Found Glasses'].affected=[''];
creatorCache['Found Glasses'].canStart={};
creatorCache['Found Glasses'].canStart.game=\`canStart() {
        return false;
    }\`;
creatorCache['Found Glasses'].canStart.pred=\`\`;
creatorCache['Found Glasses'].effect={};
creatorCache['Found Glasses'].effect.game=\`finish() {
    }\`;
creatorCache['Found Glasses'].effect.pred=\`\`;
creatorCache['Buy Mana Z1']={};
creatorCache['Buy Mana Z1'].affected=['mana','gold','manaBought'];
creatorCache['Buy Mana Z1'].effect={};
creatorCache['Buy Mana Z1'].effect.game=\`finish() {
        addMana(resources.gold * this.goldCost());
        resetResource("gold");
    }\`;
creatorCache['Buy Mana Z1'].effect.pred=\`(r) => {
          if (r.isManaDrought) {
            let spendGold = Math.min(r.gold, 300);
            let buyMana = Math.min(spendGold *  Action.BuyManaZ1.goldCost(), r.manaBought);
            r.mana+=buyMana;
            r.manaBought-=buyMana;
            r.gold-=spendGold; 
          } else { 
            r.mana += r.gold *  Action.BuyManaZ1.goldCost();
            r.gold = 0;
        }}\`;
creatorCache['Meet People']={};
creatorCache['Meet People'].affected=[''];
creatorCache['Meet People'].effect={};
creatorCache['Meet People'].effect.game=\`finish() {
        towns[0].finishProgress(this.varName, 200);
    }\`;
creatorCache['Meet People'].effect.pred=\`\`;
creatorCache['Train Strength']={};
creatorCache['Train Strength'].affected=[''];
creatorCache['Train Strength'].effect={};
creatorCache['Train Strength'].effect.game=\`finish() {

    }\`;
creatorCache['Train Strength'].effect.pred=\`\`;
creatorCache['Short Quest']={};
creatorCache['Short Quest'].affected=['gold'];
creatorCache['Short Quest'].effect={};
creatorCache['Short Quest'].effect.game=\`finish() {
        towns[0].finishRegular(this.varName, 5, () => {
            const goldGain = this.goldCost();
            addResource("gold", goldGain);
            return goldGain;
        });
    }\`;
creatorCache['Short Quest'].effect.pred=\`(r) => {
          r.temp3 = (r.temp3 || 0) + 1;
          r.gold += r.temp3 <= towns[0].goodSQuests ?  Action.ShortQuest.goldCost() : 0;
        }\`;
creatorCache['Investigate']={};
creatorCache['Investigate'].affected=[''];
creatorCache['Investigate'].effect={};
creatorCache['Investigate'].effect.game=\`finish() {
        towns[0].finishProgress(this.varName, 500);
    }\`;
creatorCache['Investigate'].effect.pred=\`\`;
creatorCache['Long Quest']={};
creatorCache['Long Quest'].affected=['gold','rep'];
creatorCache['Long Quest'].effect={};
creatorCache['Long Quest'].effect.game=\`finish() {
        towns[0].finishRegular(this.varName, 5, () => {
            addResource("reputation", 1);
            const goldGain = this.goldCost();
            addResource("gold", goldGain);
            return goldGain;
        });
    }\`;
creatorCache['Long Quest'].effect.pred=\`(r) => {
          r.temp4 = (r.temp4 || 0) + 1;
          r.gold += r.temp4 <= towns[0].goodLQuests ?  Action.LongQuest.goldCost() : 0;
          r.rep += r.temp4 <= towns[0].goodLQuests ? 1 : 0;
        }\`;
creatorCache['Throw Party']={};
creatorCache['Throw Party'].affected=['rep'];
creatorCache['Throw Party'].canStart={};
creatorCache['Throw Party'].canStart.game=\`canStart() {
        return resources.reputation >= 2;
    }\`;
creatorCache['Throw Party'].canStart.pred=\`(input)=>(input.rep>=2)\`;
creatorCache['Throw Party'].effect={};
creatorCache['Throw Party'].effect.cost=\`cost() {
        addResource("reputation", -2);
    }\`;
creatorCache['Throw Party'].effect.game=\`finish() {
        towns[0].finishProgress("Met", 3200);
    }\`;
creatorCache['Throw Party'].effect.pred=\`(r,k) => r.rep-=2\`;
creatorCache['Warrior Lessons']={};
creatorCache['Warrior Lessons'].affected=[''];
creatorCache['Warrior Lessons'].canStart={};
creatorCache['Warrior Lessons'].canStart.game=\`canStart() {
        return resources.reputation >= 2;
    }\`;
creatorCache['Warrior Lessons'].canStart.pred=\`(input) => input.rep >= 2\`;
creatorCache['Warrior Lessons'].effect={};
creatorCache['Warrior Lessons'].effect.skills={};	
creatorCache['Warrior Lessons'].effect.skills.Combat=100,
creatorCache['Warrior Lessons'].effect.game=\`finish() {
        handleSkillExp(this.skills);
    }\`;
creatorCache['Warrior Lessons'].effect.pred=\`(r, k) => k.combat += 100*(1+getBuffLevel("Heroism") * 0.02)\`;
creatorCache['Mage Lessons']={};
creatorCache['Mage Lessons'].affected=[''];
creatorCache['Mage Lessons'].canStart={};
creatorCache['Mage Lessons'].canStart.game=\`canStart() {
        return resources.reputation >= 2;
    }\`;
creatorCache['Mage Lessons'].canStart.pred=\`(input) => input.rep >= 2\`;
creatorCache['Mage Lessons'].effect={};
creatorCache['Mage Lessons'].effect.skills={};	
creatorCache['Mage Lessons'].effect.skills.Magic=\`Magic() {
            return 100 * (1 + getSkillLevel("Alchemy") / 100);
        }\`,
creatorCache['Mage Lessons'].effect.game=\`finish() {
        handleSkillExp(this.skills);
    }\`;
creatorCache['Mage Lessons'].effect.pred=\`(r, k) => k.magic += 100 * (1 +  getSkillLevelFromExp(k.alchemy) / 100)\`;
creatorCache['Heal The Sick']={};
creatorCache['Heal The Sick'].affected=['rep'];
creatorCache['Heal The Sick'].canStart={};
creatorCache['Heal The Sick'].canStart.game=\`canStart() {
        return resources.reputation >= 1;
    }\`;
creatorCache['Heal The Sick'].canStart.pred=\`(input) => (input.rep >= 1)\`;
creatorCache['Heal The Sick'].loop={};
creatorCache['Heal The Sick'].loop.cost={};
creatorCache['Heal The Sick'].loop.cost.game=\`loopCost(segment) {
        return fibonacci(2 + Math.floor((towns[0].HealLoopCounter + segment) / this.segments + 0.0000001)) * 5000;
    }\`;
creatorCache['Heal The Sick'].loop.cost.pred=\`(p, a) => segment =>  fibonacci(2 + Math.floor((p.completed + segment) / a.segments + .0000001)) * 5000\`;
creatorCache['Heal The Sick'].loop.tick={};
creatorCache['Heal The Sick'].loop.tick.game=\`tickProgress(offset) {
        return getSkillLevel("Magic") * Math.max(getSkillLevel("Restoration") / 50, 1) * (1 + getLevel(this.loopStats[(towns[0].HealLoopCounter + offset) % this.loopStats.length]) / 100) * Math.sqrt(1 + towns[0].totalHeal / 100);
    }\`;
creatorCache['Heal The Sick'].loop.tick.pred=\`(p, a, s, k) => offset =>  getSkillLevelFromExp(k.magic) * Math.max( getSkillLevelFromExp(k.restoration) / 50, 1) * h.getStatProgress(p, a, s, offset) * Math.sqrt(1 + p.total / 100)\`;
creatorCache['Heal The Sick'].loop.end={};
creatorCache['Heal The Sick'].loop.end.skills={};	
creatorCache['Heal The Sick'].loop.end.skills.Magic=10,
creatorCache['Heal The Sick'].loop.end.game=\`finish() {
        handleSkillExp(this.skills);
    }\`;
creatorCache['Heal The Sick'].loop.end.pred=\`(r, k) => k.magic += 10\`;
creatorCache['Heal The Sick'].loop.loop={};
creatorCache['Heal The Sick'].loop.loop.game=\`loopsFinished() {
        addResource("reputation", 3);
    }\`;
creatorCache['Heal The Sick'].loop.loop.pred=\`(r) => r.rep += 3\`;
creatorCache['Heal The Sick'].loop.max=\`\`;
creatorCache['Fight Monsters']={};
creatorCache['Fight Monsters'].affected=['gold'];
creatorCache['Fight Monsters'].canStart={};
creatorCache['Fight Monsters'].canStart.game=\`canStart() {
        return resources.reputation >= 2;
    }\`;
creatorCache['Fight Monsters'].canStart.pred=\`(input) => (input.rep >= 2)\`;
creatorCache['Fight Monsters'].loop={};
creatorCache['Fight Monsters'].loop.cost={};
creatorCache['Fight Monsters'].loop.cost.game=\`loopCost(segment) {
        return fibonacci(Math.floor((towns[0].FightLoopCounter + segment) - towns[0].FightLoopCounter / 3 + 0.0000001)) * 10000;
    }\`;
creatorCache['Fight Monsters'].loop.cost.pred=\`(p, a) => segment =>  fibonacci(Math.floor((p.completed + segment) - p.completed / a.segments + .0000001)) * 10000\`;
creatorCache['Fight Monsters'].loop.tick={};
creatorCache['Fight Monsters'].loop.tick.game=\`tickProgress(offset) {
        return getSelfCombat() * (1 + getLevel(this.loopStats[(towns[0].FightLoopCounter + offset) % this.loopStats.length]) / 100) * Math.sqrt(1 + towns[0].totalFight / 100);
    }\`;
creatorCache['Fight Monsters'].loop.tick.pred=\`(p, a, s, k, r) => offset => h.getSelfCombat(r, k) * Math.sqrt(1 + p.total / 100) * h.getStatProgress(p, a, s, offset)\`;
creatorCache['Fight Monsters'].loop.end={};
creatorCache['Fight Monsters'].loop.end.skills={};	
creatorCache['Fight Monsters'].loop.end.skills.Combat=10,
creatorCache['Fight Monsters'].loop.end.game=\`finish() {
        handleSkillExp(this.skills);
    }\`;
creatorCache['Fight Monsters'].loop.end.pred=\`(r, k) => k.combat += 10*(1+getBuffLevel("Heroism") * 0.02)\`;
creatorCache['Fight Monsters'].loop.segment={};
creatorCache['Fight Monsters'].loop.segment.game=\`segmentFinished() {
        addResource("gold", 20);
    }\`;
creatorCache['Fight Monsters'].loop.segment.pred=\`(r) => r.gold += 20\`;
creatorCache['Fight Monsters'].loop.loop={};
creatorCache['Fight Monsters'].loop.loop.game=\`loopsFinished() {
        // empty
    }\`;
creatorCache['Fight Monsters'].loop.loop.pred=\`\`;
creatorCache['Fight Monsters'].loop.max=\`\`;
creatorCache['Small Dungeon']={};
creatorCache['Small Dungeon'].affected=['soul'];
creatorCache['Small Dungeon'].canStart={};
creatorCache['Small Dungeon'].canStart.game=\`canStart() {
        const curFloor = Math.floor((towns[this.townNum].SDungeonLoopCounter) / this.segments + 0.0000001);
        return resources.reputation >= 2 && curFloor < dungeons[this.dungeonNum].length;
    }\`;
creatorCache['Small Dungeon'].canStart.pred=\`(input) => input.rep >= 2\`;
creatorCache['Small Dungeon'].loop={};
creatorCache['Small Dungeon'].loop.cost={};
creatorCache['Small Dungeon'].loop.cost.game=\`loopCost(segment) {
        return precision3(Math.pow(2, Math.floor((towns[this.townNum].SDungeonLoopCounter + segment) / this.segments + 0.0000001)) * 15000);
    }\`;
creatorCache['Small Dungeon'].loop.cost.pred=\`(p, a) => segment =>  precision3(Math.pow(2, Math.floor((p.completed + segment) / a.segments + .0000001)) * 15000)\`;
creatorCache['Small Dungeon'].loop.tick={};
creatorCache['Small Dungeon'].loop.tick.game=\`tickProgress(offset) {
        const floor = Math.floor((towns[this.townNum].SDungeonLoopCounter) / this.segments + 0.0000001);
        return (getSelfCombat() + getSkillLevel("Magic")) *
            (1 + getLevel(this.loopStats[(towns[this.townNum].SDungeonLoopCounter + offset) % this.loopStats.length]) / 100) *
            Math.sqrt(1 + dungeons[this.dungeonNum][floor].completed / 200);
    }\`;
creatorCache['Small Dungeon'].loop.tick.pred=\`(p, a, s, k, r) => offset => {
            let floor = Math.floor(p.completed / a.segments + .0000001);

            return floor in  dungeons[a.dungeonNum] ? (h.getSelfCombat(r, k) +  getSkillLevelFromExp(k.magic)) * h.getStatProgress(p, a, s, offset) * Math.sqrt(1 +  dungeons[a.dungeonNum][floor].completed / 200) : 0;
          }\`;
creatorCache['Small Dungeon'].loop.end={};
creatorCache['Small Dungeon'].loop.end.skills={};	
creatorCache['Small Dungeon'].loop.end.skills.Combat=5,	
creatorCache['Small Dungeon'].loop.end.skills.Magic=5,
creatorCache['Small Dungeon'].loop.end.game=\`finish() {
        handleSkillExp(this.skills);
    }\`;
creatorCache['Small Dungeon'].loop.end.pred=\`(r, k) => (k.combat += 5*(1+getBuffLevel("Heroism") * 0.02), k.magic += 5)\`;
creatorCache['Small Dungeon'].loop.loop={};
creatorCache['Small Dungeon'].loop.loop.game=\`loopsFinished() {
        const curFloor = Math.floor((towns[this.townNum].SDungeonLoopCounter) / this.segments + 0.0000001 - 1);
        const success = finishDungeon(this.dungeonNum, curFloor);
        if (success === true && storyMax <= 1) {
            unlockGlobalStory(1);
        } else if (success === false && storyMax <= 2) {
            unlockGlobalStory(2);
        }
    }\`;
creatorCache['Small Dungeon'].loop.loop.pred=\`(r) => {
            let ssGained = h.getRewardSS(0);
            r.completionsSmallDungeon = (r.completionsSmallDungeon || 0) + 1;
            r.soul += ssGained;
            r.expectedSS += ssGained * dungeons[0][r.completionsSmallDungeon - 1].ssChance;
          }\`;
creatorCache['Small Dungeon'].loop.max=\`(a) =>  dungeons[a.dungeonNum].length\`;
creatorCache['Buy Supplies']={};
creatorCache['Buy Supplies'].affected=['gold'];
creatorCache['Buy Supplies'].canStart={};
creatorCache['Buy Supplies'].canStart.game=\`canStart() {
        return resources.gold >= towns[0].suppliesCost && !resources.supplies;
    }\`;
creatorCache['Buy Supplies'].canStart.pred=\`(input) => input.gold >= 300 - Math.max((input.supplyDiscount || 0) * 20, 0)\`;
creatorCache['Buy Supplies'].effect={};
creatorCache['Buy Supplies'].effect.cost=\`cost() {
        addResource("gold", -towns[0].suppliesCost);
    }\`;
creatorCache['Buy Supplies'].effect.game=\`finish() {
        addResource("supplies", true);
    }\`;
creatorCache['Buy Supplies'].effect.pred=\`(r) => (r.gold -= 300 - Math.max((r.supplyDiscount || 0) * 20, 0), r.supplies = (r.supplies || 0) + 1)\`;
creatorCache['Haggle']={};
creatorCache['Haggle'].affected=['rep'];
creatorCache['Haggle'].canStart={};
creatorCache['Haggle'].canStart.game=\`canStart() {
        return resources.reputation >= 1;
    }\`;
creatorCache['Haggle'].canStart.pred=\`(input) => (input.rep > 0)\`;
creatorCache['Haggle'].effect={};
creatorCache['Haggle'].effect.cost=\`cost() {
        addResource("reputation", -1);
    }\`;
creatorCache['Haggle'].effect.game=\`finish() {
        towns[0].suppliesCost -= 20;
        if (towns[0].suppliesCost < 0) {
            towns[0].suppliesCost = 0;
        }
        view.requestUpdate("updateResource", "supplies");
    }\`;
creatorCache['Haggle'].effect.pred=\`(r) => (r.rep--, r.supplyDiscount = (r.supplyDiscount >= 15 ? 15 : (r.supplyDiscount || 0) + 1))\`;
creatorCache['Start Journey']={};
creatorCache['Start Journey'].affected=[''];
creatorCache['Start Journey'].canStart={};
creatorCache['Start Journey'].canStart.game=\`canStart() {
        return resources.supplies;
    }\`;
creatorCache['Start Journey'].canStart.pred=\`r => r.supplies >= 1\`;
creatorCache['Start Journey'].effect={};
creatorCache['Start Journey'].effect.cost=\`cost() {
        addResource("supplies", false);
    }\`;
creatorCache['Start Journey'].effect.game=\`finish() {
        unlockTown(1);
    }\`;
creatorCache['Start Journey'].effect.pred=\`(r) => (r.supplies = (r.supplies || 0) - 1, r.town =1)\`;
creatorCache['Hitch Ride']={};
creatorCache['Hitch Ride'].affected=[''];
creatorCache['Hitch Ride'].canStart={};
creatorCache['Hitch Ride'].canStart.game=\`canStart() {
        return true;
    }\`;
creatorCache['Hitch Ride'].canStart.pred=\`true\`;
creatorCache['Hitch Ride'].effect={};
creatorCache['Hitch Ride'].effect.game=\`finish() {
        unlockTown(2);
    }\`;
creatorCache['Hitch Ride'].effect.pred=\`(r,k) => ( r.town =2)\`;
creatorCache['Open Rift']={};
creatorCache['Open Rift'].affected=[''];
creatorCache['Open Rift'].effect={};
creatorCache['Open Rift'].effect.skills={};	
creatorCache['Open Rift'].effect.skills.Dark=1000,
creatorCache['Open Rift'].effect.game=\`finish() {
        handleSkillExp(this.skills);
        addResource("supplies", false);
        unlockTown(5);
    }\`;
creatorCache['Open Rift'].effect.pred=\`(r,k) => (r.supplies = 0, r.town =5, k.dark+=1000)\`;
creatorCache['Explore Forest']={};
creatorCache['Explore Forest'].affected=[''];
creatorCache['Explore Forest'].effect={};
creatorCache['Explore Forest'].effect.game=\`finish() {
        towns[1].finishProgress(this.varName, 100 * (resources.glasses ? 2 : 1));
    }\`;
creatorCache['Explore Forest'].effect.pred=\`\`;
creatorCache['Wild Mana']={};
creatorCache['Wild Mana'].affected=['mana'];
creatorCache['Wild Mana'].manaCost={};
creatorCache['Wild Mana'].manaCost.game=\`manaCost() {
        return Math.ceil(150 * getSkillBonus("Practical"));
    }\`;
creatorCache['Wild Mana'].manaCost.pred=\`\`;
creatorCache['Wild Mana'].effect={};
creatorCache['Wild Mana'].effect.game=\`finish() {
        towns[1].finishRegular(this.varName, 10, () => {
            const manaGain = this.goldCost();
            addMana(manaGain);
            return manaGain;
        });
    }\`;
creatorCache['Wild Mana'].effect.pred=\`(r) => {
          r.temp5 = (r.temp5 || 0) + 1;
          r.mana += r.temp5 <= towns[1].goodWildMana ?  Action.WildMana.goldCost() : 0;
        }\`;
creatorCache['Gather Herbs']={};
creatorCache['Gather Herbs'].affected=['herbs'];
creatorCache['Gather Herbs'].manaCost={};
creatorCache['Gather Herbs'].manaCost.game=\`manaCost() {
        return Math.ceil(200 * (1 - towns[1].getLevel("Hermit") * 0.005));
    }\`;
creatorCache['Gather Herbs'].manaCost.pred=\`\`;
creatorCache['Gather Herbs'].effect={};
creatorCache['Gather Herbs'].effect.game=\`finish() {
        towns[1].finishRegular(this.varName, 10, () => {
            addResource("herbs", 1);
            return 1;
        });
    }\`;
creatorCache['Gather Herbs'].effect.pred=\`(r) => {
          r.temp6 = (r.temp6 || 0) + 1;
          r.herbs += r.temp6 <= towns[1].goodHerbs ? 1 : 0;
        }\`;
creatorCache['Hunt']={};
creatorCache['Hunt'].affected=['hide'];
creatorCache['Hunt'].effect={};
creatorCache['Hunt'].effect.game=\`finish() {
        towns[1].finishRegular(this.varName, 10, () => {
            addResource("hide", 1);
            return 1;
        });
    }\`;
creatorCache['Hunt'].effect.pred=\`(r) => {
          r.temp7 = (r.temp7 || 0) + 1;
          r.hide += r.temp7 <= towns[1].goodHunt ? 1 : 0;
        }\`;
creatorCache['Sit By Waterfall']={};
creatorCache['Sit By Waterfall'].affected=[''];
creatorCache['Sit By Waterfall'].effect={};
creatorCache['Sit By Waterfall'].effect.game=\`finish() {
        unlockStory("satByWaterfall");
    }\`;
creatorCache['Sit By Waterfall'].effect.pred=\`\`;
creatorCache['Old Shortcut']={};
creatorCache['Old Shortcut'].affected=[''];
creatorCache['Old Shortcut'].effect={};
creatorCache['Old Shortcut'].effect.game=\`finish() {
        towns[1].finishProgress(this.varName, 100);
        view.requestUpdate("adjustManaCost", "Continue On");
    }\`;
creatorCache['Old Shortcut'].effect.pred=\`\`;
creatorCache['Talk To Hermit']={};
creatorCache['Talk To Hermit'].affected=[''];
creatorCache['Talk To Hermit'].effect={};
creatorCache['Talk To Hermit'].effect.game=\`finish() {
        towns[1].finishProgress(this.varName, 50 * (1 + towns[1].getLevel("Shortcut") / 100));
        view.requestUpdate("adjustManaCost", "Learn Alchemy");
        view.requestUpdate("adjustManaCost", "Gather Herbs");
        view.requestUpdate("adjustManaCost", "Practical Magic");
    }\`;
creatorCache['Talk To Hermit'].effect.pred=\`\`;
creatorCache['Practical Magic']={};
creatorCache['Practical Magic'].affected=[''];
creatorCache['Practical Magic'].manaCost={};
creatorCache['Practical Magic'].manaCost.game=\`manaCost() {
        return Math.ceil(4000 * (1 - towns[1].getLevel("Hermit") * 0.005));
    }\`;
creatorCache['Practical Magic'].manaCost.pred=\`\`;
creatorCache['Practical Magic'].effect={};
creatorCache['Practical Magic'].effect.skills={};	
creatorCache['Practical Magic'].effect.skills.Practical=100,
creatorCache['Practical Magic'].effect.game=\`finish() {
        handleSkillExp(this.skills);
        view.requestUpdate("adjustManaCost", "Wild Mana");
        view.requestUpdate("adjustManaCost", "Smash Pots");
        view.requestUpdate("adjustGoldCosts", null);
    }\`;
creatorCache['Practical Magic'].effect.pred=\`(r, k) => k.practical += 100\`;
creatorCache['Learn Alchemy']={};
creatorCache['Learn Alchemy'].affected=['herbs'];
creatorCache['Learn Alchemy'].manaCost={};
creatorCache['Learn Alchemy'].manaCost.game=\`manaCost() {
        return Math.ceil(5000 * (1 - towns[1].getLevel("Hermit") * 0.005));
    }\`;
creatorCache['Learn Alchemy'].manaCost.pred=\`\`;
creatorCache['Learn Alchemy'].canStart={};
creatorCache['Learn Alchemy'].canStart.game=\`canStart() {
        return resources.herbs >= 10;
    }\`;
creatorCache['Learn Alchemy'].canStart.pred=\`(input) => (input.herbs >= 10)\`;
creatorCache['Learn Alchemy'].effect={};
creatorCache['Learn Alchemy'].effect.skills={};	
creatorCache['Learn Alchemy'].effect.skills.Magic=50,	
creatorCache['Learn Alchemy'].effect.skills.Alchemy=50,
creatorCache['Learn Alchemy'].effect.cost=\`cost() {
        addResource("herbs", -10);
    }\`;
creatorCache['Learn Alchemy'].effect.game=\`finish() {
        handleSkillExp(this.skills);
        view.requestUpdate("adjustExpGain", Action.MageLessons);
    }\`;
creatorCache['Learn Alchemy'].effect.pred=\`(r, k) => (r.herbs -= 10, k.alchemy += 50, k.magic += 50)\`;
creatorCache['Brew Potions']={};
creatorCache['Brew Potions'].affected=['herbs','potions'];
creatorCache['Brew Potions'].manaCost={};
creatorCache['Brew Potions'].manaCost.game=\`manaCost() {
        return Math.ceil(4000);
    }\`;
creatorCache['Brew Potions'].manaCost.pred=\`\`;
creatorCache['Brew Potions'].canStart={};
creatorCache['Brew Potions'].canStart.game=\`canStart() {
        return resources.herbs >= 10 && resources.reputation >= 5;
    }\`;
creatorCache['Brew Potions'].canStart.pred=\`(input) => (input.herbs >= 10 && input.rep >= 5)\`;
creatorCache['Brew Potions'].effect={};
creatorCache['Brew Potions'].effect.skills={};	
creatorCache['Brew Potions'].effect.skills.Magic=50,	
creatorCache['Brew Potions'].effect.skills.Alchemy=25,
creatorCache['Brew Potions'].effect.cost=\`cost() {
        addResource("herbs", -10);
    }\`;
creatorCache['Brew Potions'].effect.game=\`finish() {
        addResource("potions", 1);
        handleSkillExp(this.skills);
        unlockStory("potionBrewed");
    }\`;
creatorCache['Brew Potions'].effect.pred=\`(r, k) => (r.herbs -= 10, r.potions++, k.alchemy += 25, k.magic += 50)\`;
creatorCache['Train Dexterity']={};
creatorCache['Train Dexterity'].affected=[''];
creatorCache['Train Dexterity'].effect={};
creatorCache['Train Dexterity'].effect.game=\`finish() {
        unlockStory("dexterityTrained");
    }\`;
creatorCache['Train Dexterity'].effect.pred=\`\`;
creatorCache['Train Speed']={};
creatorCache['Train Speed'].affected=[''];
creatorCache['Train Speed'].effect={};
creatorCache['Train Speed'].effect.game=\`finish() {
        unlockStory("speedTrained");
    }\`;
creatorCache['Train Speed'].effect.pred=\`\`;
creatorCache['Follow Flowers']={};
creatorCache['Follow Flowers'].affected=[''];
creatorCache['Follow Flowers'].effect={};
creatorCache['Follow Flowers'].effect.game=\`finish() {
        towns[1].finishProgress(this.varName, 100 * (resources.glasses ? 2 : 1));
    }\`;
creatorCache['Follow Flowers'].effect.pred=\`\`;
creatorCache['Bird Watching']={};
creatorCache['Bird Watching'].affected=[''];
creatorCache['Bird Watching'].canStart={};
creatorCache['Bird Watching'].canStart.game=\`canStart() {
        return resources.glasses;
    }\`;
creatorCache['Bird Watching'].canStart.pred=\`(input) => input.glasses\`;
creatorCache['Bird Watching'].effect={};
creatorCache['Bird Watching'].effect.game=\`finish() {
        unlockStory("birdsWatched");
    }\`;
creatorCache['Bird Watching'].effect.pred=\`\`;
creatorCache['Clear Thicket']={};
creatorCache['Clear Thicket'].affected=[''];
creatorCache['Clear Thicket'].effect={};
creatorCache['Clear Thicket'].effect.game=\`finish() {
        towns[1].finishProgress(this.varName, 100);
    }\`;
creatorCache['Clear Thicket'].effect.pred=\`\`;
creatorCache['Talk To Witch']={};
creatorCache['Talk To Witch'].affected=[''];
creatorCache['Talk To Witch'].effect={};
creatorCache['Talk To Witch'].effect.game=\`finish() {
        towns[1].finishProgress(this.varName, 100);
        view.requestUpdate("adjustManaCost", "Dark Magic");
        view.requestUpdate("adjustManaCost", "Dark Ritual");
    }\`;
creatorCache['Talk To Witch'].effect.pred=\`\`;
creatorCache['Dark Magic']={};
creatorCache['Dark Magic'].affected=['rep'];
creatorCache['Dark Magic'].manaCost={};
creatorCache['Dark Magic'].manaCost.game=\`manaCost() {
        return Math.ceil(6000 * (1 - towns[1].getLevel("Witch") * 0.005));
    }\`;
creatorCache['Dark Magic'].manaCost.pred=\`\`;
creatorCache['Dark Magic'].canStart={};
creatorCache['Dark Magic'].canStart.game=\`canStart() {
        return resources.reputation <= 0;
    }\`;
creatorCache['Dark Magic'].canStart.pred=\`(input) => (input.rep <= 0)\`;
creatorCache['Dark Magic'].effect={};
creatorCache['Dark Magic'].effect.skills={};	
creatorCache['Dark Magic'].effect.skills.Dark=\`Dark() {
            return Math.floor(100 * (1 + getBuffLevel("Ritual") / 100));
        }\`,
creatorCache['Dark Magic'].effect.cost=\`cost() {
        addResource("reputation", -1);
    }\`;
creatorCache['Dark Magic'].effect.game=\`finish() {
        handleSkillExp(this.skills);
        view.requestUpdate("adjustGoldCost", {varName: "Pots", cost: Action.SmashPots.goldCost()});
        view.requestUpdate("adjustGoldCost", {varName: "WildMana", cost: Action.WildMana.goldCost()});
    }\`;
creatorCache['Dark Magic'].effect.pred=\`(r, k) => (r.rep--, k.dark += Math.floor(100 * (1 + buffs.Ritual.amt / 100)))\`;
creatorCache['Dark Ritual']={};
creatorCache['Dark Ritual'].affected=['ritual','soul'];
creatorCache['Dark Ritual'].manaCost={};
creatorCache['Dark Ritual'].manaCost.game=\`manaCost() {
        return Math.ceil(50000 * (1 - towns[1].getLevel("Witch") * 0.005));
    }\`;
creatorCache['Dark Ritual'].manaCost.pred=\`\`;
creatorCache['Dark Ritual'].canStart={};
creatorCache['Dark Ritual'].canStart.game=\`canStart() {
        return resources.reputation <= -5 && towns[this.townNum].DarkRitualLoopCounter === 0 && checkSoulstoneSac(this.goldCost()) && getBuffLevel("Ritual") < parseInt(document.getElementById("buffRitualCap").value);
    }\`;
creatorCache['Dark Ritual'].canStart.pred=\`(input) => (input.rep <= -5)\`;
creatorCache['Dark Ritual'].loop={};
creatorCache['Dark Ritual'].loop.cost={};
creatorCache['Dark Ritual'].loop.cost.game=\`loopCost(segment) {
        return 1000000 * (segment * 2 + 1);
    }\`;
creatorCache['Dark Ritual'].loop.cost.pred=\`(p) => segment => 1000000 * (segment * 2 + 1)\`;
creatorCache['Dark Ritual'].loop.tick={};
creatorCache['Dark Ritual'].loop.tick.game=\`tickProgress(offset) {
        return getSkillLevel("Dark") * (1 + getLevel(this.loopStats[(towns[1].DarkRitualLoopCounter + offset) % this.loopStats.length]) / 100) / (1 - towns[1].getLevel("Witch") * 0.005);
    }\`;
creatorCache['Dark Ritual'].loop.tick.pred=\`(p, a, s, k) => offset => {
            let attempt = Math.floor(p.completed / a.segments + .0000001);

            return attempt < 1 ? ( getSkillLevelFromExp(k.dark) * h.getStatProgress(p, a, s, offset)) / (1 - towns[1].getLevel("Witch") * .005) : 0;
          }\`;
creatorCache['Dark Ritual'].loop.end={};
creatorCache['Dark Ritual'].loop.end.game=\`finish() {
        view.requestUpdate("updateBuff", "Ritual");
        view.requestUpdate("adjustExpGain", Action.DarkMagic);
        if (towns[1].DarkRitualLoopCounter >= 0) unlockStory("darkRitualThirdSegmentReached");
    }\`;
creatorCache['Dark Ritual'].loop.end.pred=\`\`;
creatorCache['Dark Ritual'].loop.loop={};
creatorCache['Dark Ritual'].loop.loop.game=\`loopsFinished() {
        sacrificeSoulstones(this.goldCost());
        addBuffAmt("Ritual", 1);
        view.requestUpdate("updateSoulstones", null);
        view.requestUpdate("adjustGoldCost", {varName: "DarkRitual", cost: this.goldCost()});
    }\`;
creatorCache['Dark Ritual'].loop.loop.pred=\`(r) => {
            r.ritual++;
            let ssCost = Action.DarkRitual.goldCost();
            r.nonDungeonSS -= ssCost;
            r.soul -= ssCost;
          }\`;
creatorCache['Dark Ritual'].loop.max=\`() => 1\`;
creatorCache['Continue On']={};
creatorCache['Continue On'].affected=[''];
creatorCache['Continue On'].manaCost={};
creatorCache['Continue On'].manaCost.game=\`manaCost() {
        return Math.ceil(8000 - (60 * towns[1].getLevel("Shortcut")));
    }\`;
creatorCache['Continue On'].manaCost.pred=\`\`;
creatorCache['Continue On'].effect={};
creatorCache['Continue On'].effect.game=\`finish() {
        unlockTown(2);
    }\`;
creatorCache['Continue On'].effect.pred=\`(r) => r.town = 2\`;
creatorCache['Explore City']={};
creatorCache['Explore City'].affected=[''];
creatorCache['Explore City'].effect={};
creatorCache['Explore City'].effect.game=\`finish() {
        towns[2].finishProgress(this.varName, 100 * (resources.glasses ? 2 : 1));
    }\`;
creatorCache['Explore City'].effect.pred=\`\`;
creatorCache['Gamble']={};
creatorCache['Gamble'].affected=['gold','rep'];
creatorCache['Gamble'].canStart={};
creatorCache['Gamble'].canStart.game=\`canStart() {
        return resources.gold >= 20 && resources.reputation >= -5;
    }\`;
creatorCache['Gamble'].canStart.pred=\`(input) => (input.rep >= -5 && input.gold >= 20)\`;
creatorCache['Gamble'].effect={};
creatorCache['Gamble'].effect.cost=\`cost() {
        addResource("gold", -20);
        addResource("reputation", -1);
    }\`;
creatorCache['Gamble'].effect.game=\`finish() {
        towns[2].finishRegular(this.varName, 10, () => {
            let goldGain = Math.floor(60 * getSkillBonus("Thievery"));
            addResource("gold", goldGain);
            return 60;
        });
    }\`;
creatorCache['Gamble'].effect.pred=\`(r) => {
          r.temp8 = (r.temp8 || 0) + 1;
          r.gold += (r.temp8 <= towns[2].goodGamble ? Math.floor(60 * Math.pow(1 + getSkillLevel("Thievery") / 60, 0.25)) : 0)-20;
          r.rep--;
        }\`;
creatorCache['Get Drunk']={};
creatorCache['Get Drunk'].affected=['rep'];
creatorCache['Get Drunk'].canStart={};
creatorCache['Get Drunk'].canStart.game=\`canStart() {
        return resources.reputation >= -3;
    }\`;
creatorCache['Get Drunk'].canStart.pred=\`(input) => (input.rep >= -3)\`;
creatorCache['Get Drunk'].effect={};
creatorCache['Get Drunk'].effect.cost=\`cost() {
        addResource("reputation", -1);
    }\`;
creatorCache['Get Drunk'].effect.game=\`finish() {
        towns[2].finishProgress(this.varName, 100);
    }\`;
creatorCache['Get Drunk'].effect.pred=\`(r) => r.rep--\`;
creatorCache['Buy Mana Z3']={};
creatorCache['Buy Mana Z3'].affected=['mana','gold'];
creatorCache['Buy Mana Z3'].canStart={};
creatorCache['Buy Mana Z3'].canStart.game=\`canStart() {
        return !portalUsed;
    }\`;
creatorCache['Buy Mana Z3'].canStart.pred=\`true\`;
creatorCache['Buy Mana Z3'].effect={};
creatorCache['Buy Mana Z3'].effect.game=\`finish() {
        addMana(resources.gold * this.goldCost());
        resetResource("gold");
    }\`;
creatorCache['Buy Mana Z3'].effect.pred=\`(r) => (r.mana += r.gold *  Action.BuyManaZ3.goldCost(), r.gold = 0)\`;
creatorCache['Sell Potions']={};
creatorCache['Sell Potions'].affected=['gold','potions'];
creatorCache['Sell Potions'].effect={};
creatorCache['Sell Potions'].effect.game=\`finish() {
        if (resources.potions >= 20) unlockStory("sell20PotionsInALoop");
        addResource("gold", resources.potions * getSkillLevel("Alchemy"));
        resetResource("potions");
        unlockStory("potionSold");
        if (getSkillLevel("Alchemy") >= 100) unlockStory("sellPotionFor100Gold");
    }\`;
creatorCache['Sell Potions'].effect.pred=\`(r, k) => (r.gold += r.potions *  getSkillLevelFromExp(k.alchemy), r.potions = 0)\`;
creatorCache['Adventure Guild']={};
creatorCache['Adventure Guild'].affected=['gold','adventures'];
creatorCache['Adventure Guild'].canStart={};
creatorCache['Adventure Guild'].canStart.game=\`canStart() {
        return guild === "";
    }\`;
creatorCache['Adventure Guild'].canStart.pred=\`(input) => (input.guild=='')\`;
creatorCache['Adventure Guild'].loop={};
creatorCache['Adventure Guild'].loop.cost={};
creatorCache['Adventure Guild'].loop.cost.game=\`loopCost(segment) {
        return precision3(Math.pow(1.2, towns[2]['@{this.varName}LoopCounter'] + segment)) * 5e6;
    }\`;
creatorCache['Adventure Guild'].loop.cost.pred=\`(p) => segment =>  precision3(Math.pow(1.2, p.completed + segment)) * 5e6\`;
creatorCache['Adventure Guild'].loop.tick={};
creatorCache['Adventure Guild'].loop.tick.game=\`tickProgress(offset) {
        return (getSkillLevel("Magic") / 2 +
                getSelfCombat("Combat")) *
                (1 + getLevel(this.loopStats[(towns[2]['@{this.varName}LoopCounter'] + offset) % this.loopStats.length]) / 100) *
                Math.sqrt(1 + towns[2]['total@{this.varName}'] / 1000);
    }\`;
creatorCache['Adventure Guild'].loop.tick.pred=\`(p, a, s, k, r) => offset => (h.getSelfCombat(r, k) +  getSkillLevelFromExp(k.magic) / 2) * h.getStatProgress(p, a, s, offset) * Math.sqrt(1 + p.total / 1000)\`;
creatorCache['Adventure Guild'].loop.end={};
creatorCache['Adventure Guild'].loop.end.game=\`finish() {
        guild = "Adventure";
        unlockStory("advGuildTestsTaken");
    }\`;
creatorCache['Adventure Guild'].loop.end.pred=\`(r) => (r.guild='adventure')\`;
creatorCache['Adventure Guild'].loop.segment={};
creatorCache['Adventure Guild'].loop.segment.game=\`segmentFinished() {
        curAdvGuildSegment++;
        addMana(200);
    }\`;
creatorCache['Adventure Guild'].loop.segment.pred=\`(r) => (r.mana += 200, r.adventures++)\`;
creatorCache['Adventure Guild'].loop.loop={};
creatorCache['Adventure Guild'].loop.loop.game=\`loopsFinished() {
        if (curAdvGuildSegment >= 0) unlockStory("advGuildRankEReached");
        if (curAdvGuildSegment >= 3) unlockStory("advGuildRankDReached");
        if (curAdvGuildSegment >= 6) unlockStory("advGuildRankCReached");
        if (curAdvGuildSegment >= 9) unlockStory("advGuildRankBReached");
        if (curAdvGuildSegment >= 12) unlockStory("advGuildRankAReached");
        if (curAdvGuildSegment >= 15) unlockStory("advGuildRankSReached");
        if (curAdvGuildSegment >= 27) unlockStory("advGuildRankUReached");
        if (curAdvGuildSegment >= 39) unlockStory("advGuildRankGodlikeReached");
    }\`;
creatorCache['Adventure Guild'].loop.loop.pred=\`\`;
creatorCache['Adventure Guild'].loop.max=\`\`;
creatorCache['Gather Team']={};
creatorCache['Gather Team'].affected=['team','gold'];
creatorCache['Gather Team'].canStart={};
creatorCache['Gather Team'].canStart.game=\`canStart() {
        return guild === "Adventure" && resources.gold >= (resources.teamMembers + 1) * 100;
    }\`;
creatorCache['Gather Team'].canStart.pred=\`(input) => ((input.guild=='adventure')&&(input.gold>=(input.team+1) * 100))\`;
creatorCache['Gather Team'].effect={};
creatorCache['Gather Team'].effect.cost=\`cost() {
        // cost comes after finish
        addResource("gold", -(resources.teamMembers) * 100);
    }\`;
creatorCache['Gather Team'].effect.game=\`finish() {
        addResource("teamMembers", 1);
        unlockStory("teammateGathered");
        if (resources.teamMembers >= 5) unlockStory("fullParty");
    }\`;
creatorCache['Gather Team'].effect.pred=\`(r) => (r.team = (r.team || 0) + 1, r.gold -= r.team * 100)\`;
creatorCache['Large Dungeon']={};
creatorCache['Large Dungeon'].affected=['team','soul'];
creatorCache['Large Dungeon'].canStart={};
creatorCache['Large Dungeon'].canStart.game=\`canStart() {
        const curFloor = Math.floor((towns[this.townNum].LDungeonLoopCounter) / this.segments + 0.0000001);
        return resources.teamMembers >= 1 && curFloor < dungeons[this.dungeonNum].length;
    }\`;
creatorCache['Large Dungeon'].canStart.pred=\`(input) => (input.team>0)\`;
creatorCache['Large Dungeon'].loop={};
creatorCache['Large Dungeon'].loop.cost={};
creatorCache['Large Dungeon'].loop.cost.game=\`loopCost(segment) {
        return precision3(Math.pow(3, Math.floor((towns[this.townNum].LDungeonLoopCounter + segment) / this.segments + 0.0000001)) * 5e5);
    }\`;
creatorCache['Large Dungeon'].loop.cost.pred=\`(p, a) => segment =>  precision3(Math.pow(3, Math.floor((p.completed + segment) / a.segments + .0000001)) * 5e5)\`;
creatorCache['Large Dungeon'].loop.tick={};
creatorCache['Large Dungeon'].loop.tick.game=\`tickProgress(offset) {
        const floor = Math.floor((towns[this.townNum].LDungeonLoopCounter) / this.segments + 0.0000001);
        return (getTeamCombat() + getSkillLevel("Magic")) *
            (1 + getLevel(this.loopStats[(towns[this.townNum].LDungeonLoopCounter + offset) % this.loopStats.length]) / 100) *
            Math.sqrt(1 + dungeons[this.dungeonNum][floor].completed / 200);
    }\`;
creatorCache['Large Dungeon'].loop.tick.pred=\`(p, a, s, k, r) => offset => {
            let floor = Math.floor(p.completed / a.segments + .0000001);
            return floor in  dungeons[a.dungeonNum] ? (h.getTeamCombat(r, k) +  getSkillLevelFromExp(k.magic)) * h.getStatProgress(p, a, s, offset) * Math.sqrt(1 +  dungeons[a.dungeonNum][floor].completed / 200) : 0;
          }\`;
creatorCache['Large Dungeon'].loop.end={};
creatorCache['Large Dungeon'].loop.end.skills={};	
creatorCache['Large Dungeon'].loop.end.skills.Combat=15,	
creatorCache['Large Dungeon'].loop.end.skills.Magic=15,
creatorCache['Large Dungeon'].loop.end.game=\`finish() {
        handleSkillExp(this.skills);
        unlockStory("largeDungeonAttempted");
        if (towns[2].LDungeonLoopCounter >= 63) unlockStory("clearLDungeon");
    }\`;
creatorCache['Large Dungeon'].loop.end.pred=\`(r, k) => (k.combat += 15*(1+getBuffLevel("Heroism") * 0.02), k.magic += 15)\`;
creatorCache['Large Dungeon'].loop.loop={};
creatorCache['Large Dungeon'].loop.loop.game=\`loopsFinished() {
        const curFloor = Math.floor((towns[this.townNum].LDungeonLoopCounter) / this.segments + 0.0000001 - 1);
        finishDungeon(this.dungeonNum, curFloor);
    }\`;
creatorCache['Large Dungeon'].loop.loop.pred=\`(r) => {
            let ssGained = h.getRewardSS(1);
            r.completionsLargeDungeon = (r.completionsLargeDungeon || 0) + 1;
            r.soul += ssGained;
            r.expectedSS += ssGained * dungeons[1][r.completionsLargeDungeon - 1].ssChance;
          }\`;
creatorCache['Large Dungeon'].loop.max=\`(a) =>  dungeons[a.dungeonNum].length\`;
creatorCache['Crafting Guild']={};
creatorCache['Crafting Guild'].affected=['gold','crafts'];
creatorCache['Crafting Guild'].canStart={};
creatorCache['Crafting Guild'].canStart.game=\`canStart() {
        return guild === "";
    }\`;
creatorCache['Crafting Guild'].canStart.pred=\`(input) => (input.guild=='')\`;
creatorCache['Crafting Guild'].loop={};
creatorCache['Crafting Guild'].loop.cost={};
creatorCache['Crafting Guild'].loop.cost.game=\`loopCost(segment) {
        return precision3(Math.pow(1.2, towns[2]['@{this.varName}LoopCounter'] + segment)) * 2e6;
    }\`;
creatorCache['Crafting Guild'].loop.cost.pred=\`(p) => segment =>  precision3(Math.pow(1.2, p.completed + segment)) * 2e6\`;
creatorCache['Crafting Guild'].loop.tick={};
creatorCache['Crafting Guild'].loop.tick.game=\`tickProgress(offset) {
        return (getSkillLevel("Magic") / 2 +
                getSkillLevel("Crafting")) *
                (1 + getLevel(this.loopStats[(towns[2]['@{this.varName}LoopCounter'] + offset) % this.loopStats.length]) / 100) *
                Math.sqrt(1 + towns[2]['total@{this.varName}'] / 1000);
    }\`;
creatorCache['Crafting Guild'].loop.tick.pred=\`(p, a, s, k) => offset => ( getSkillLevelFromExp(k.magic) / 2 +  getSkillLevelFromExp(k.crafting)) * h.getStatProgress(p, a, s, offset) * Math.sqrt(1 + p.total / 1000)\`;
creatorCache['Crafting Guild'].loop.end={};
creatorCache['Crafting Guild'].loop.end.skills={};	
creatorCache['Crafting Guild'].loop.end.skills.Crafting=50,
creatorCache['Crafting Guild'].loop.end.game=\`finish() {
        guild = "Crafting";
        unlockStory("craftGuildTestsTaken");
    }\`;
creatorCache['Crafting Guild'].loop.end.pred=\`(r) => (r.guild='crafting')\`;
creatorCache['Crafting Guild'].loop.segment={};
creatorCache['Crafting Guild'].loop.segment.game=\`segmentFinished() {
        curCraftGuildSegment++;
        handleSkillExp(this.skills);
        addResource("gold", 10);
    }\`;
creatorCache['Crafting Guild'].loop.segment.pred=\`(r, k) => (r.gold += 10, r.crafts++, k.crafting += 50)\`;
creatorCache['Crafting Guild'].loop.loop={};
creatorCache['Crafting Guild'].loop.loop.game=\`loopsFinished() {
        if (curCraftGuildSegment >= 0) unlockStory("craftGuildRankEReached");
        if (curCraftGuildSegment >= 3) unlockStory("craftGuildRankDReached");
        if (curCraftGuildSegment >= 6) unlockStory("craftGuildRankCReached");
        if (curCraftGuildSegment >= 9) unlockStory("craftGuildRankBReached");
        if (curCraftGuildSegment >= 12) unlockStory("craftGuildRankAReached");
        if (curCraftGuildSegment >= 15) unlockStory("craftGuildRankSReached");
        if (curCraftGuildSegment >= 27) unlockStory("craftGuildRankUReached");
        if (curCraftGuildSegment >= 39) unlockStory("craftGuildRankGodlikeReached");
    }\`;
creatorCache['Crafting Guild'].loop.loop.pred=\`\`;
creatorCache['Crafting Guild'].loop.max=\`\`;
creatorCache['Craft Armor']={};
creatorCache['Craft Armor'].affected=['hide'];
creatorCache['Craft Armor'].canStart={};
creatorCache['Craft Armor'].canStart.game=\`canStart() {
        return resources.hide >= 2;
    }\`;
creatorCache['Craft Armor'].canStart.pred=\`(input) => (input.hide >= 2)\`;
creatorCache['Craft Armor'].effect={};
creatorCache['Craft Armor'].effect.cost=\`cost() {
        addResource("hide", -2);
    }\`;
creatorCache['Craft Armor'].effect.game=\`finish() {
        addResource("armor", 1);
        unlockStory("armorCrafted");
        if (resources.armor >= 10) unlockStory("craft10Armor");
    }\`;
creatorCache['Craft Armor'].effect.pred=\`(r) => (r.hide -= 2, r.armor = (r.armor || 0) + 1)\`;
creatorCache['Apprentice']={};
creatorCache['Apprentice'].affected=[''];
creatorCache['Apprentice'].canStart={};
creatorCache['Apprentice'].canStart.game=\`canStart() {
        return guild === "Crafting";
    }\`;
creatorCache['Apprentice'].canStart.pred=\`(input) => (input.guild=='crafting')\`;
creatorCache['Apprentice'].effect={};
creatorCache['Apprentice'].effect.skills={};	
creatorCache['Apprentice'].effect.skills.Crafting=\`Crafting() {
            return 10 * (1 + towns[2].getLevel("Apprentice") / 100);
        }\`,
creatorCache['Apprentice'].effect.game=\`finish() {
        towns[2].finishProgress(this.varName, 30 * getCraftGuildRank().bonus);
        handleSkillExp(this.skills);
        view.requestUpdate("adjustExpGain", Action.Apprentice);
    }\`;
creatorCache['Apprentice'].effect.pred=\`(r, k) => Math.min((r.apprentice = (r.apprentice || towns[2].expApprentice) + 30 * h.getGuildRankBonus(r.crafts || 0),505000), k.crafting += 10 * (1 + h.getTownLevelFromExp(r.apprentice) / 100))\`;
creatorCache['Mason']={};
creatorCache['Mason'].affected=[''];
creatorCache['Mason'].canStart={};
creatorCache['Mason'].canStart.game=\`canStart() {
        return guild === "Crafting";
    }\`;
creatorCache['Mason'].canStart.pred=\`(input) => (input.guild=='crafting')\`;
creatorCache['Mason'].effect={};
creatorCache['Mason'].effect.skills={};	
creatorCache['Mason'].effect.skills.Crafting=\`Crafting() {
            return 20 * (1 + towns[2].getLevel("Mason") / 100);
        }\`,
creatorCache['Mason'].effect.game=\`finish() {
        towns[2].finishProgress(this.varName, 20 * getCraftGuildRank().bonus);
        handleSkillExp(this.skills);
        view.requestUpdate("adjustExpGain", Action.Mason);
    }\`;
creatorCache['Mason'].effect.pred=\`(r, k) => (r.mason = Math.min((r.mason || towns[2].expMason) + 20 * h.getGuildRankBonus(r.crafts || 0),505000), k.crafting += 20 * (1 + h.getTownLevelFromExp(r.mason) / 100))\`;
creatorCache['Architect']={};
creatorCache['Architect'].affected=[''];
creatorCache['Architect'].canStart={};
creatorCache['Architect'].canStart.game=\`canStart() {
        return guild === "Crafting";
    }\`;
creatorCache['Architect'].canStart.pred=\`(input) => (input.guild=='crafting')\`;
creatorCache['Architect'].effect={};
creatorCache['Architect'].effect.skills={};	
creatorCache['Architect'].effect.skills.Crafting=\`Crafting() {
            return 40 * (1 + towns[2].getLevel("Architect") / 100);
        }\`,
creatorCache['Architect'].effect.game=\`finish() {
        towns[2].finishProgress(this.varName, 10 * getCraftGuildRank().bonus);
        handleSkillExp(this.skills);
        view.requestUpdate("adjustExpGain", Action.Architect);
    }\`;
creatorCache['Architect'].effect.pred=\`(r, k) => Math.min((r.architect = (r.architect || towns[2].expArchitect) + 10 * h.getGuildRankBonus(r.crafts || 0),505000), k.crafting += 40 * (1 + h.getTownLevelFromExp(r.architect) / 100))\`;
creatorCache['Read Books']={};
creatorCache['Read Books'].affected=[''];
creatorCache['Read Books'].canStart={};
creatorCache['Read Books'].canStart.game=\`canStart() {
        return resources.glasses;
    }\`;
creatorCache['Read Books'].canStart.pred=\`(input) => input.glasses\`;
creatorCache['Read Books'].effect={};
creatorCache['Read Books'].effect.game=\`finish() {
        unlockStory("booksRead");
    }\`;
creatorCache['Read Books'].effect.pred=\`\`;
creatorCache['Buy Pickaxe']={};
creatorCache['Buy Pickaxe'].affected=['gold'];
creatorCache['Buy Pickaxe'].canStart={};
creatorCache['Buy Pickaxe'].canStart.game=\`canStart() {
        return resources.gold >= 200;
    }\`;
creatorCache['Buy Pickaxe'].canStart.pred=\`(input) =>(input.gold>=200)\`;
creatorCache['Buy Pickaxe'].effect={};
creatorCache['Buy Pickaxe'].effect.cost=\`cost() {
        addResource("gold", -200);
    }\`;
creatorCache['Buy Pickaxe'].effect.game=\`finish() {
        addResource("pickaxe", true);
        unlockStory("pickaxeBought");
    }\`;
creatorCache['Buy Pickaxe'].effect.pred=\`(r) => (r.gold -= 200, r.pickaxe = true)\`;
creatorCache['Heroes Trial']={};
creatorCache['Heroes Trial'].affected=['heroism'];
creatorCache['Heroes Trial'].canStart={};
creatorCache['Heroes Trial'].canStart.game=\`canStart() {
        return this.currentFloor() < trialFloors[this.trialNum];
    }\`;
creatorCache['Heroes Trial'].canStart.pred=\`true\`;
creatorCache['Heroes Trial'].loop={};
creatorCache['Heroes Trial'].loop.cost={};
creatorCache['Heroes Trial'].loop.cost.game=\`function(segment) {
    return precision3(Math.pow(this.baseScaling, Math.floor((towns[this.townNum]['@{this.varName}LoopCounter'] + segment) / this.segments + 0.0000001)) * this.exponentScaling * getSkillBonus("Assassin"));
}\`;
creatorCache['Heroes Trial'].loop.cost.pred=\`(p, a) => segment => precision3(Math.pow(a.baseScaling, Math.floor((p.completed + segment) / a.segments + .0000001)) * a.exponentScaling * getSkillBonus("Assassin"))\`;
creatorCache['Heroes Trial'].loop.tick={};
creatorCache['Heroes Trial'].loop.tick.game=\`function(offset) {
    return this.baseProgress() *
        (1 + getLevel(this.loopStats[(towns[this.townNum]['@{this.varName}LoopCounter'] + offset) % this.loopStats.length]) / 100) *
        Math.sqrt(1 + trials[this.trialNum][this.currentFloor()].completed / 200);
}\`;
creatorCache['Heroes Trial'].loop.tick.pred=\`(p, a, s, k, r) => offset => {
            const floor = Math.floor(p.completed / a.segments + .0000001);
            return floor in trials[a.trialNum] ? h.getTeamCombat(r, k) * h.getStatProgress(p, a, s, offset) * Math.sqrt(1 + trials[a.trialNum][floor].completed / 200) : 0;
          }\`;
creatorCache['Heroes Trial'].loop.end={};
creatorCache['Heroes Trial'].loop.end.skills={};	
creatorCache['Heroes Trial'].loop.end.skills.Combat=500,	
creatorCache['Heroes Trial'].loop.end.skills.Pyromancy=100,	
creatorCache['Heroes Trial'].loop.end.skills.Restoration=100,
creatorCache['Heroes Trial'].loop.end.game=\`finish() {
        handleSkillExp(this.skills);
        view.requestUpdate("updateBuff", "Heroism");
    }\`;
creatorCache['Heroes Trial'].loop.end.pred=\`(r,k) => (k.combat+=500*(1+getBuffLevel("Heroism") * 0.02),k.pyromancy+=100*(1+getBuffLevel("Heroism") * 0.02),k.restoration+=100*(1+getBuffLevel("Heroism") * 0.02))\`;
creatorCache['Heroes Trial'].loop.loop={};
creatorCache['Heroes Trial'].loop.loop.game=\`function() {
    const finishedFloor = this.currentFloor() - 1;
    //console.log("Finished floor: " + finishedFloor + " Current Floor: " + this.currentFloor());
    trials[this.trialNum][finishedFloor].completed++;
    if (finishedFloor > trials[this.trialNum].highestFloor || trials[this.trialNum].highestFloor === undefined) trials[this.trialNum].highestFloor = finishedFloor;
    view.requestUpdate("updateTrialInfo", {trialNum: this.trialNum, curFloor: this.currentFloor()});
    this.floorReward();
}\`;
creatorCache['Heroes Trial'].loop.loop.pred=\`(r) => (r.heroism=(r.heroism||0)+1)\`;
creatorCache['Heroes Trial'].loop.max=\`(a) => trialFloors[a.trialNum]\`;
creatorCache['Start Trek']={};
creatorCache['Start Trek'].affected=[''];
creatorCache['Start Trek'].manaCost={};
creatorCache['Start Trek'].manaCost.game=\`manaCost() {
        return Math.ceil(12000);
    }\`;
creatorCache['Start Trek'].manaCost.pred=\`\`;
creatorCache['Start Trek'].effect={};
creatorCache['Start Trek'].effect.game=\`finish() {
        unlockTown(3);
    }\`;
creatorCache['Start Trek'].effect.pred=\`(r) => r.town = 3\`;
creatorCache['Underworld']={};
creatorCache['Underworld'].affected=['gold'];
creatorCache['Underworld'].canStart={};
creatorCache['Underworld'].canStart.game=\`canStart() {
        return resources.gold >= 500;
    }\`;
creatorCache['Underworld'].canStart.pred=\`(input)=>(input.gold>=500)\`;
creatorCache['Underworld'].effect={};
creatorCache['Underworld'].effect.cost=\`cost() {
        addResource("gold", -500)
    }\`;
creatorCache['Underworld'].effect.game=\`finish() {
        unlockTown(7);
    }\`;
creatorCache['Underworld'].effect.pred=\`(r) => (r.town = 7,r.gold-=500)\`;
creatorCache['Climb Mountain']={};
creatorCache['Climb Mountain'].affected=[''];
creatorCache['Climb Mountain'].effect={};
creatorCache['Climb Mountain'].effect.game=\`finish() {
        towns[3].finishProgress(this.varName, 100 * (resources.pickaxe ? 2 : 1));
    }\`;
creatorCache['Climb Mountain'].effect.pred=\`\`;
creatorCache['Mana Geyser']={};
creatorCache['Mana Geyser'].affected=['mana'];
creatorCache['Mana Geyser'].manaCost={};
creatorCache['Mana Geyser'].manaCost.game=\`manaCost() {
        return Math.ceil(2000 * getSkillBonus("Spatiomancy"));
    }\`;
creatorCache['Mana Geyser'].manaCost.pred=\`\`;
creatorCache['Mana Geyser'].canStart={};
creatorCache['Mana Geyser'].canStart.game=\`canStart() {
        return resources.pickaxe;
    }\`;
creatorCache['Mana Geyser'].canStart.pred=\`(input) => input.pickaxe\`;
creatorCache['Mana Geyser'].effect={};
creatorCache['Mana Geyser'].effect.game=\`finish() {
        towns[3].finishRegular(this.varName, 100, () => {
            addMana(5000);
            return 5000;
        });
    }\`;
creatorCache['Mana Geyser'].effect.pred=\`(r) => {
          r.temp9 = (r.temp9 || 0) + 1;
          r.mana += r.temp9 <= towns[3].goodGeysers ? 5000 : 0;
        }\`;
creatorCache['Decipher Runes']={};
creatorCache['Decipher Runes'].affected=[''];
creatorCache['Decipher Runes'].effect={};
creatorCache['Decipher Runes'].effect.game=\`finish() {
        towns[3].finishProgress(this.varName, 100 * (resources.glasses ? 2 : 1));
        view.requestUpdate("adjustManaCost", "Chronomancy");
        view.requestUpdate("adjustManaCost", "Pyromancy");
    }\`;
creatorCache['Decipher Runes'].effect.pred=\`\`;
creatorCache['Chronomancy']={};
creatorCache['Chronomancy'].affected=[''];
creatorCache['Chronomancy'].manaCost={};
creatorCache['Chronomancy'].manaCost.game=\`manaCost() {
        return Math.ceil(10000 * (1 - towns[3].getLevel("Runes") * 0.005));
    }\`;
creatorCache['Chronomancy'].manaCost.pred=\`\`;
creatorCache['Chronomancy'].effect={};
creatorCache['Chronomancy'].effect.skills={};	
creatorCache['Chronomancy'].effect.skills.Chronomancy=100,
creatorCache['Chronomancy'].effect.game=\`finish() {
        handleSkillExp(this.skills);
    }\`;
creatorCache['Chronomancy'].effect.pred=\`(r, k) => k.chronomancy += 100\`;
creatorCache['Looping Potion']={};
creatorCache['Looping Potion'].affected=['herbs','lpotions'];
creatorCache['Looping Potion'].manaCost={};
creatorCache['Looping Potion'].manaCost.game=\`manaCost() {
        return Math.ceil(30000);
    }\`;
creatorCache['Looping Potion'].manaCost.pred=\`\`;
creatorCache['Looping Potion'].canStart={};
creatorCache['Looping Potion'].canStart.game=\`canStart() {
        return resources.herbs >= 400;
    }\`;
creatorCache['Looping Potion'].canStart.pred=\`(input) => (input.herbs>=400)\`;
creatorCache['Looping Potion'].effect={};
creatorCache['Looping Potion'].effect.skills={};	
creatorCache['Looping Potion'].effect.skills.Alchemy=100,
creatorCache['Looping Potion'].effect.cost=\`cost() {
        addResource("herbs", -400);
    }\`;
creatorCache['Looping Potion'].effect.game=\`finish() {
        addResource("loopingPotion", true);
        handleSkillExp(this.skills);
    }\`;
creatorCache['Looping Potion'].effect.pred=\`(r, k) => (r.herbs -= 400, r.lpotions=1, k.alchemy += 100)\`;
creatorCache['Pyromancy']={};
creatorCache['Pyromancy'].affected=[''];
creatorCache['Pyromancy'].manaCost={};
creatorCache['Pyromancy'].manaCost.game=\`manaCost() {
        return Math.ceil(14000 * (1 - towns[3].getLevel("Runes") * 0.005));
    }\`;
creatorCache['Pyromancy'].manaCost.pred=\`\`;
creatorCache['Pyromancy'].effect={};
creatorCache['Pyromancy'].effect.skills={};	
creatorCache['Pyromancy'].effect.skills.Pyromancy=100,
creatorCache['Pyromancy'].effect.game=\`finish() {
        handleSkillExp(this.skills);
    }\`;
creatorCache['Pyromancy'].effect.pred=\`(r, k) => k.pyromancy += 100*(1+getBuffLevel("Heroism") * 0.02)\`;
creatorCache['Explore Cavern']={};
creatorCache['Explore Cavern'].affected=[''];
creatorCache['Explore Cavern'].effect={};
creatorCache['Explore Cavern'].effect.game=\`finish() {
        towns[3].finishProgress(this.varName, 100);
    }\`;
creatorCache['Explore Cavern'].effect.pred=\`\`;
creatorCache['Mine Soulstones']={};
creatorCache['Mine Soulstones'].affected=['soul'];
creatorCache['Mine Soulstones'].canStart={};
creatorCache['Mine Soulstones'].canStart.game=\`canStart() {
        return resources.pickaxe;
    }\`;
creatorCache['Mine Soulstones'].canStart.pred=\`(input) => input.pickaxe\`;
creatorCache['Mine Soulstones'].effect={};
creatorCache['Mine Soulstones'].effect.game=\`finish() {
        towns[3].finishRegular(this.varName, 10, () => {
            const statToAdd = statList[Math.floor(Math.random() * statList.length)];
            stats[statToAdd].soulstone +=  Math.floor(getSkillBonus("Divine"));
            view.requestUpdate("updateSoulstones", null);
        });
    }\`;
creatorCache['Mine Soulstones'].effect.pred=\`(r) => {
          r.temp10 = (r.temp10 || 0) + 1;
          let ssGained = r.temp10 <= towns[3].goodMineSoulstones ? h.getRewardSS(0) : 0;
          r.nonDungeonSS += ssGained;
          r.soul += ssGained;
        }\`;
creatorCache['Hunt Trolls']={};
creatorCache['Hunt Trolls'].affected=['blood'];
creatorCache['Hunt Trolls'].loop={};
creatorCache['Hunt Trolls'].loop.cost={};
creatorCache['Hunt Trolls'].loop.cost.game=\`loopCost(segment) {
        return precision3(Math.pow(2, Math.floor((towns[this.townNum].HuntTrollsLoopCounter + segment) / this.segments + 0.0000001)) * 1e6);
    }\`;
creatorCache['Hunt Trolls'].loop.cost.pred=\`(p, a) => segment =>  precision3(Math.pow(2, Math.floor((p.completed + segment) / a.segments+.0000001)) * 1e6)\`;
creatorCache['Hunt Trolls'].loop.tick={};
creatorCache['Hunt Trolls'].loop.tick.game=\`tickProgress(offset) {
        return (getSelfCombat() * (1 + getLevel(this.loopStats[(towns[3].HuntTrollsLoopCounter + offset) % this.loopStats.length]) / 100) * Math.sqrt(1 + towns[3].totalHuntTrolls / 100));
    }\`;
creatorCache['Hunt Trolls'].loop.tick.pred=\`(p, a, s, k, r) => offset => (h.getSelfCombat(r, k) * Math.sqrt(1 + p.total/100) * (1 +  getLevelFromExp(s[a.loopStats[(p.completed + offset) % a.loopStats.length]])/100))\`;
creatorCache['Hunt Trolls'].loop.end={};
creatorCache['Hunt Trolls'].loop.end.skills={};	
creatorCache['Hunt Trolls'].loop.end.skills.Combat=1000,
creatorCache['Hunt Trolls'].loop.end.game=\`finish() {
        //handleSkillExp(this.skills);
    }\`;
creatorCache['Hunt Trolls'].loop.end.pred=\`\`;
creatorCache['Hunt Trolls'].loop.segment={};
creatorCache['Hunt Trolls'].loop.segment.game=\`segmentFinished() {
    }\`;
creatorCache['Hunt Trolls'].loop.segment.pred=\`\`;
creatorCache['Hunt Trolls'].loop.loop={};
creatorCache['Hunt Trolls'].loop.loop.game=\`loopsFinished() {
        handleSkillExp(this.skills);
        addResource("blood", 1);
        if (resources.blood >= 6) unlockStory("slay6TrollsInALoop");
        if (resources.blood >= 20) unlockStory("slay20TrollsInALoop");
    }\`;
creatorCache['Hunt Trolls'].loop.loop.pred=\`(r, k) => (r.blood++, k.combat += 1000*(1+getBuffLevel("Heroism") * 0.02))\`;
creatorCache['Hunt Trolls'].loop.max=\`\`;
creatorCache['Check Walls']={};
creatorCache['Check Walls'].affected=[''];
creatorCache['Check Walls'].effect={};
creatorCache['Check Walls'].effect.game=\`finish() {
        towns[3].finishProgress(this.varName, 100);
    }\`;
creatorCache['Check Walls'].effect.pred=\`\`;
creatorCache['Take Artifacts']={};
creatorCache['Take Artifacts'].affected=['artifacts'];
creatorCache['Take Artifacts'].effect={};
creatorCache['Take Artifacts'].effect.game=\`finish() {
        towns[3].finishRegular(this.varName, 25, () => {
            addResource("artifacts", 1);
        });
    }\`;
creatorCache['Take Artifacts'].effect.pred=\`(r) => {
          r.temp11 = (r.temp11 || 0) + 1;
          r.artifacts += r.temp11 <= towns[3].goodArtifacts ? 1 : 0;
        }\`;
creatorCache['Imbue Mind']={};
creatorCache['Imbue Mind'].affected=['mind','soul'];
creatorCache['Imbue Mind'].canStart={};
creatorCache['Imbue Mind'].canStart.game=\`canStart() {
        return towns[3].ImbueMindLoopCounter === 0 && checkSoulstoneSac(this.goldCost()) && getBuffLevel("Imbuement") < parseInt(document.getElementById("buffImbuementCap").value);
    }\`;
creatorCache['Imbue Mind'].canStart.pred=\`true\`;
creatorCache['Imbue Mind'].loop={};
creatorCache['Imbue Mind'].loop.cost={};
creatorCache['Imbue Mind'].loop.cost.game=\`loopCost(segment) {
        return 100000000 * (segment * 5 + 1);
    }\`;
creatorCache['Imbue Mind'].loop.cost.pred=\`(p) => segment => 100000000 * (segment * 5 + 1)\`;
creatorCache['Imbue Mind'].loop.tick={};
creatorCache['Imbue Mind'].loop.tick.game=\`tickProgress(offset) {
        return getSkillLevel("Magic") * (1 + getLevel(this.loopStats[(towns[3].ImbueMindLoopCounter + offset) % this.loopStats.length]) / 100);
    }\`;
creatorCache['Imbue Mind'].loop.tick.pred=\`(p, a, s, k) => offset => {
            let attempt = Math.floor(p.completed / a.segments + .0000001);

            return attempt < 1 ? ( getSkillLevelFromExp(k.magic) * h.getStatProgress(p, a, s, offset)) : 0;
          }\`;
creatorCache['Imbue Mind'].loop.end={};
creatorCache['Imbue Mind'].loop.end.game=\`finish() {
        view.requestUpdate("updateBuff", "Imbuement");
        if (options.autoMaxTraining) capAllTraining();
        if (towns[3].ImbueMindLoopCounter >= 0) unlockStory("imbueMindThirdSegmentReached");
    }\`;
creatorCache['Imbue Mind'].loop.end.pred=\`\`;
creatorCache['Imbue Mind'].loop.loop={};
creatorCache['Imbue Mind'].loop.loop.game=\`loopsFinished() {
        sacrificeSoulstones(this.goldCost());
        trainingLimits++;
        addBuffAmt("Imbuement", 1);
        view.requestUpdate("updateSoulstones", null);
        view.requestUpdate("adjustGoldCost", {varName: "ImbueMind", cost: this.goldCost()});
    }\`;
creatorCache['Imbue Mind'].loop.loop.pred=\`(r) => {
            r.mind++;
            let ssCost = Action.ImbueMind.goldCost();
            r.nonDungeonSS -= ssCost;
            r.soul -= ssCost;
          }\`;
creatorCache['Imbue Mind'].loop.max=\`() => 1\`;
creatorCache['Imbue Body']={};
creatorCache['Imbue Body'].affected=['body'];
creatorCache['Imbue Body'].canStart={};
creatorCache['Imbue Body'].canStart.game=\`canStart() {
        let tempCanStart = true;
        for (const stat in stats) {
            if (getTalent(stat) < getBuffLevel("Imbuement2") + 1) tempCanStart = false;
        }
        return towns[3].ImbueBodyLoopCounter === 0 && (getBuffLevel("Imbuement") > getBuffLevel("Imbuement2")) && tempCanStart;
    }\`;
creatorCache['Imbue Body'].canStart.pred=\`true\`;
creatorCache['Imbue Body'].loop={};
creatorCache['Imbue Body'].loop.cost={};
creatorCache['Imbue Body'].loop.cost.game=\`loopCost(segment) {
        return 100000000 * (segment * 5 + 1);
    }\`;
creatorCache['Imbue Body'].loop.cost.pred=\`(p) => segment => 100000000 * (segment * 5 + 1)\`;
creatorCache['Imbue Body'].loop.tick={};
creatorCache['Imbue Body'].loop.tick.game=\`tickProgress(offset) {
        return getSkillLevel("Magic") * (1 + getLevel(this.loopStats[(towns[3].ImbueBodyLoopCounter + offset) % this.loopStats.length]) / 100);
    }\`;
creatorCache['Imbue Body'].loop.tick.pred=\`(p, a, s, k) => offset => {
            let attempt = Math.floor(p.completed / a.segments + .0000001);

            return attempt < 1 ? ( getSkillLevelFromExp(k.magic) * h.getStatProgress(p, a, s, offset)) : 0;
          }\`;
creatorCache['Imbue Body'].loop.end={};
creatorCache['Imbue Body'].loop.end.game=\`finish() {
        view.requestUpdate("updateBuff", "Imbuement2");
    }\`;
creatorCache['Imbue Body'].loop.end.pred=\`\`;
creatorCache['Imbue Body'].loop.loop={};
creatorCache['Imbue Body'].loop.loop.game=\`loopsFinished() {
        for (const stat in stats) {
            let targetTalentLevel = getTalent(stat) - getBuffLevel("Imbuement2") - 1;
            stats[stat].talent = getExpOfLevel(targetTalentLevel);
        }
        view.updateStats();
        addBuffAmt("Imbuement2", 1);
        view.requestUpdate("adjustGoldCost", {varName: "ImbueBody", cost: this.goldCost()});
    }\`;
creatorCache['Imbue Body'].loop.loop.pred=\`(r) => r.body++\`;
creatorCache['Imbue Body'].loop.max=\`() => 1\`;
creatorCache['Face Judgement']={};
creatorCache['Face Judgement'].affected=[''];
creatorCache['Face Judgement'].effect={};
creatorCache['Face Judgement'].effect.game=\`finish() {
        unlockStory("judgementFaced");
        if (resources.reputation >= 50) {
            unlockStory("acceptedIntoValhalla");
            unlockGlobalStory(7);
            unlockTown(4);
        } else if (resources.reputation <= -50) {
            unlockStory("castIntoShadowRealm");
            unlockGlobalStory(8);
            unlockTown(5);
        }
    }\`;
creatorCache['Face Judgement'].effect.pred=\`(r) =>(r.town = r.rep>=50?4:(r.rep<=-50?5:3))\`;
creatorCache['Guru']={};
creatorCache['Guru'].affected=['herbs'];
creatorCache['Guru'].canStart={};
creatorCache['Guru'].canStart.game=\`canStart() {
        return resources.herbs >= 1000;
    }\`;
creatorCache['Guru'].canStart.pred=\`(input)=>(input.herbs>=1000)\`;
creatorCache['Guru'].effect={};
creatorCache['Guru'].effect.cost=\`cost() {
        addResource("herbs", -1000);
    }\`;
creatorCache['Guru'].effect.game=\`finish() {
        unlockTown(4);
    }\`;
creatorCache['Guru'].effect.pred=\`(r) => (r.town = 4,r.herbs-=1000)\`;
creatorCache['Guided Tour']={};
creatorCache['Guided Tour'].affected=['gold'];
creatorCache['Guided Tour'].canStart={};
creatorCache['Guided Tour'].canStart.game=\`canStart() {
        return resources.gold >= 10;
    }\`;
creatorCache['Guided Tour'].canStart.pred=\`(input) => {
          return (input.gold >= 10);
        }\`;
creatorCache['Guided Tour'].effect={};
creatorCache['Guided Tour'].effect.cost=\`cost() {
        addResource("gold", -10);
    }\`;
creatorCache['Guided Tour'].effect.game=\`finish() {
        towns[4].finishProgress(this.varName, 100 * (resources.glasses ? 2 : 1));
    }\`;
creatorCache['Guided Tour'].effect.pred=\`(r,k)=>(r.gold -= 10)\`;
creatorCache['Canvass']={};
creatorCache['Canvass'].affected=[''];
creatorCache['Canvass'].effect={};
creatorCache['Canvass'].effect.game=\`finish() {
        towns[4].finishProgress(this.varName, 50);
    }\`;
creatorCache['Canvass'].effect.pred=\`\`;
creatorCache['Donate']={};
creatorCache['Donate'].affected=['gold','rep'];
creatorCache['Donate'].canStart={};
creatorCache['Donate'].canStart.game=\`canStart() {
        return resources.gold >= 20;
    }\`;
creatorCache['Donate'].canStart.pred=\`(input) => {
          return (input.gold >= 20);
        }\`;
creatorCache['Donate'].effect={};
creatorCache['Donate'].effect.game=\`finish() {
        addResource("gold", -20);
        addResource("reputation", 1);
        unlockStory("donatedToCharity");
    }\`;
creatorCache['Donate'].effect.pred=\`(r) => {
          r.gold -= 20;
          r.rep += 1;
        }\`;
creatorCache['Accept Donations']={};
creatorCache['Accept Donations'].affected=['gold','rep'];
creatorCache['Accept Donations'].canStart={};
creatorCache['Accept Donations'].canStart.game=\`canStart() {
        return resources.reputation > 0;
    }\`;
creatorCache['Accept Donations'].canStart.pred=\`(input) => {
          return (input.rep > 0);
        }\`;
creatorCache['Accept Donations'].effect={};
creatorCache['Accept Donations'].effect.cost=\`cost() {
        addResource("reputation", -1);
    }\`;
creatorCache['Accept Donations'].effect.game=\`finish() {
        towns[4].finishRegular(this.varName, 5, () => {
            addResource("gold", 20);
            return 20;
        });
    }\`;
creatorCache['Accept Donations'].effect.pred=\`(r) => {
          r.donateLoot = (r.donateLoot || 0) + 1;
          if (r.donateLoot<=towns[4].goodDonations) {
            r.gold += 20;
          }
          r.rep -= 1;
        }\`;
creatorCache['Tidy Up']={};
creatorCache['Tidy Up'].affected=['gold','rep'];
creatorCache['Tidy Up'].loop={};
creatorCache['Tidy Up'].loop.cost={};
creatorCache['Tidy Up'].loop.cost.game=\`loopCost(segment) {
        return fibonacci(Math.floor((towns[4].TidyLoopCounter + segment) - towns[4].TidyLoopCounter / 3 + 0.0000001)) * 1000000; // Temp.
    }\`;
creatorCache['Tidy Up'].loop.cost.pred=\`(p, a) => segment =>  fibonacci(Math.floor((p.completed + segment) - p.completed / 3 + .0000001)) * 1000000\`;
creatorCache['Tidy Up'].loop.tick={};
creatorCache['Tidy Up'].loop.tick.game=\`tickProgress(offset) {
        return getSkillLevel("Practical") * (1 + getLevel(this.loopStats[(towns[4].TidyLoopCounter + offset) % this.loopStats.length]) / 100) * Math.sqrt(1 + towns[4].totalTidy / 100);
    }\`;
creatorCache['Tidy Up'].loop.tick.pred=\`(p, a, s, k) => offset =>  getSkillLevelFromExp(k.practical) * h.getStatProgress(p, a, s, offset) * Math.sqrt(1 + p.total / 100)\`;
creatorCache['Tidy Up'].loop.end={};
creatorCache['Tidy Up'].loop.end.game=\`finish(){
        // empty
    }\`;
creatorCache['Tidy Up'].loop.end.pred=\`\`;
creatorCache['Tidy Up'].loop.segment={};
creatorCache['Tidy Up'].loop.segment.game=\`segmentFinished() {
        // empty.
    }\`;
creatorCache['Tidy Up'].loop.segment.pred=\`\`;
creatorCache['Tidy Up'].loop.loop={};
creatorCache['Tidy Up'].loop.loop.game=\`loopsFinished() {
        addResource("reputation", 1);
        addResource("gold", 5);
    }\`;
creatorCache['Tidy Up'].loop.loop.pred=\`(r) => {
              r.gold += 5;
              r.rep += 1;
            }\`;
creatorCache['Buy Mana Z5']={};
creatorCache['Buy Mana Z5'].affected=['mana','gold'];
creatorCache['Buy Mana Z5'].canStart={};
creatorCache['Buy Mana Z5'].canStart.game=\`canStart() {
        return !portalUsed;
    }\`;
creatorCache['Buy Mana Z5'].canStart.pred=\`true\`;
creatorCache['Buy Mana Z5'].effect={};
creatorCache['Buy Mana Z5'].effect.game=\`finish() {
        addMana(resources.gold * this.goldCost());
        resetResource("gold");
    }\`;
creatorCache['Buy Mana Z5'].effect.pred=\`(r) => (r.mana += r.gold *  Action.BuyManaZ5.goldCost(), r.gold = 0)\`;
creatorCache['Sell Artifact']={};
creatorCache['Sell Artifact'].affected=['gold','artifacts'];
creatorCache['Sell Artifact'].canStart={};
creatorCache['Sell Artifact'].canStart.game=\`canStart() {
        return resources.artifacts >= 1;
    }\`;
creatorCache['Sell Artifact'].canStart.pred=\`(input) => {
          return (input.artifacts >= 1);
        }\`;
creatorCache['Sell Artifact'].effect={};
creatorCache['Sell Artifact'].effect.cost=\`cost() {
        addResource("artifacts", -1);
    }\`;
creatorCache['Sell Artifact'].effect.game=\`finish() {
        addResource("gold", 50);
    }\`;
creatorCache['Sell Artifact'].effect.pred=\`(r) => {
          r.gold += 50;
          r.artifacts -= 1;
        }\`;
creatorCache['Gift Artifact']={};
creatorCache['Gift Artifact'].affected=['artifacts'];
creatorCache['Gift Artifact'].canStart={};
creatorCache['Gift Artifact'].canStart.game=\`canStart() {
        return resources.artifacts >= 1;
    }\`;
creatorCache['Gift Artifact'].canStart.pred=\`(input) => {
          return (input.artifacts >= 1);
        }\`;
creatorCache['Gift Artifact'].effect={};
creatorCache['Gift Artifact'].effect.cost=\`cost() {
        addResource("artifacts", -1);
    }\`;
creatorCache['Gift Artifact'].effect.game=\`finish() {
        addResource("favors", 1);
    }\`;
creatorCache['Gift Artifact'].effect.pred=\`(r) => {
          r.artifacts -= 1;
          r.favor += 1;
        }\`;
creatorCache['Mercantilism']={};
creatorCache['Mercantilism'].affected=[''];
creatorCache['Mercantilism'].canStart={};
creatorCache['Mercantilism'].canStart.game=\`canStart() {
        return resources.reputation > 0;
    }\`;
creatorCache['Mercantilism'].canStart.pred=\`(input) => (input.rep > 0)\`;
creatorCache['Mercantilism'].effect={};
creatorCache['Mercantilism'].effect.skills={};	
creatorCache['Mercantilism'].effect.skills.Mercantilism=100,
creatorCache['Mercantilism'].effect.cost=\`cost() {
        addResource("reputation", -1);
    }\`;
creatorCache['Mercantilism'].effect.game=\`finish() {
        handleSkillExp(this.skills);
        view.requestUpdate("adjustManaCost", "Buy Mana Z1");
        view.requestUpdate("adjustManaCost", "Buy Mana Z3");
        view.requestUpdate("adjustManaCost", "Buy Mana Z5");
    }\`;
creatorCache['Mercantilism'].effect.pred=\`(r, k) => {
          k.mercantilism += 100;
          r.rep--;
        }\`;
creatorCache['Charm School']={};
creatorCache['Charm School'].affected=[''];
creatorCache['Charm School'].effect={};
creatorCache['Charm School'].effect.game=\`finish() {
        // empty
    }\`;
creatorCache['Charm School'].effect.pred=\`\`;
creatorCache['Oracle']={};
creatorCache['Oracle'].affected=[''];
creatorCache['Oracle'].effect={};
creatorCache['Oracle'].effect.game=\`finish() {

    }\`;
creatorCache['Oracle'].effect.pred=\`\`;
creatorCache['Enchant Armor']={};
creatorCache['Enchant Armor'].affected=['armor','favor','enchantments'];
creatorCache['Enchant Armor'].canStart={};
creatorCache['Enchant Armor'].canStart.game=\`canStart() {
        return resources.favors >= 1 && resources.armor >= 1;
    }\`;
creatorCache['Enchant Armor'].canStart.pred=\`(input) => {
          return (input.armor >  0 && input.favor >  0);
        }\`;
creatorCache['Enchant Armor'].effect={};
creatorCache['Enchant Armor'].effect.skills={};	
creatorCache['Enchant Armor'].effect.skills.Crafting=50,
creatorCache['Enchant Armor'].effect.cost=\`cost() {
        addResource("favors", -1);
        addResource("armor", -1);
    }\`;
creatorCache['Enchant Armor'].effect.game=\`finish() {
        handleSkillExp(this.skills);
        addResource("enchantments", 1);
    }\`;
creatorCache['Enchant Armor'].effect.pred=\`(r) => {
          r.armor -= 1;
          r.favor -= 1;
          r.enchantments += 1;
        }\`;
creatorCache['Wizard College']={};
creatorCache['Wizard College'].affected=['gold','favor','wizard'];
creatorCache['Wizard College'].canStart={};
creatorCache['Wizard College'].canStart.game=\`canStart() {
        return resources.gold >= 500 && resources.favors >= 10;
    }\`;
creatorCache['Wizard College'].canStart.pred=\`(input) => {
          return (input.gold >= 500 && input.favor >= 10);
        }\`;
creatorCache['Wizard College'].loop={};
creatorCache['Wizard College'].loop.cost={};
creatorCache['Wizard College'].loop.cost.game=\`loopCost(segment) {
        return precision3(Math.pow(1.3, towns[4]['@{this.varName}LoopCounter'] + segment)) * 1e7; // Temp
    }\`;
creatorCache['Wizard College'].loop.cost.pred=\`(p) => segment =>  precision3(Math.pow(1.3, p.completed + segment)) * 1e7\`;
creatorCache['Wizard College'].loop.tick={};
creatorCache['Wizard College'].loop.tick.game=\`tickProgress(offset) {
        return (
            getSkillLevel("Magic") + getSkillLevel("Practical") + getSkillLevel("Dark") +
            getSkillLevel("Chronomancy") + getSkillLevel("Pyromancy") + getSkillLevel("Restoration") + getSkillLevel("Spatiomancy")) *
            (1 + getLevel(this.loopStats[(towns[4]['@{this.varName}LoopCounter'] + offset) % this.loopStats.length]) / 100) *
            Math.sqrt(1 + towns[4]['total@{this.varName}'] / 1000);
    }\`;
creatorCache['Wizard College'].loop.tick.pred=\`(p, a, s, k) => offset => ( getSkillLevelFromExp(k.magic) +  getSkillLevelFromExp(k.practical) +  getSkillLevelFromExp(k.dark) +
                                           getSkillLevelFromExp(k.chronomancy) +  getSkillLevelFromExp(k.pyromancy) +  getSkillLevelFromExp(k.restoration) +  getSkillLevelFromExp(k.spatiomancy)) *
                                          h.getStatProgress(p, a, s, offset) * Math.sqrt(1 + p.total / 1000)\`;
creatorCache['Wizard College'].loop.end={};
creatorCache['Wizard College'].loop.end.cost=\`cost() {
        addResource("gold", -500);
        addResource("favors", -10);
    }\`;
creatorCache['Wizard College'].loop.end.game=\`finish() {
        //guild = "Wizard";
    }\`;
creatorCache['Wizard College'].loop.end.pred=\`(r) => {r.gold -= 500; r.favor -=10;}\`;
creatorCache['Wizard College'].loop.segment={};
creatorCache['Wizard College'].loop.segment.game=\`segmentFinished() {
        curWizCollegeSegment++;
        view.requestUpdate("adjustManaCost", "Restoration");
        view.requestUpdate("adjustManaCost", "Spatiomancy");
    }\`;
creatorCache['Wizard College'].loop.segment.pred=\`(r, k) => (r.wizard++)\`;
creatorCache['Wizard College'].loop.loop={};
creatorCache['Wizard College'].loop.loop.game=\`loopsFinished() {
        // empty.
    }\`;
creatorCache['Wizard College'].loop.loop.pred=\`\`;
creatorCache['Wizard College'].loop.max=\`\`;
creatorCache['Restoration']={};
creatorCache['Restoration'].affected=[''];
creatorCache['Restoration'].manaCost={};
creatorCache['Restoration'].manaCost.game=\`manaCost() {
        return 15000 / getWizCollegeRank().bonus;
    }\`;
creatorCache['Restoration'].manaCost.pred=\`(r,k)=>(15000 / h.getWizardRankBonus(r))\`;
creatorCache['Restoration'].effect={};
creatorCache['Restoration'].effect.skills={};	
creatorCache['Restoration'].effect.skills.Restoration=100,
creatorCache['Restoration'].effect.game=\`finish() {
        handleSkillExp(this.skills);
    }\`;
creatorCache['Restoration'].effect.pred=\`(r, k) => k.restoration += 100*(1+getBuffLevel("Heroism") * 0.02)\`;
creatorCache['Spatiomancy']={};
creatorCache['Spatiomancy'].affected=[''];
creatorCache['Spatiomancy'].manaCost={};
creatorCache['Spatiomancy'].manaCost.game=\`manaCost() {
        return 20000 / getWizCollegeRank().bonus;
    }\`;
creatorCache['Spatiomancy'].manaCost.pred=\`(r,k)=>(20000 / h.getWizardRankBonus(r))\`;
creatorCache['Spatiomancy'].effect={};
creatorCache['Spatiomancy'].effect.skills={};	
creatorCache['Spatiomancy'].effect.skills.Spatiomancy=100,
creatorCache['Spatiomancy'].effect.game=\`finish() {
        handleSkillExp(this.skills);
        view.requestUpdate("adjustManaCost", "Mana Geyser");
        view.requestUpdate("adjustManaCost", "Mana Well");
        adjustAll();
        for (const action of totalActionList) {
            if (towns[action.townNum].varNames.indexOf(action.varName) !== -1) {
                view.requestUpdate("updateRegular", {name: action.varName, index: action.townNum});
            }
        }
    }\`;
creatorCache['Spatiomancy'].effect.pred=\`(r, k) => k.spatiomancy += 100\`;
creatorCache['Seek Citizenship']={};
creatorCache['Seek Citizenship'].affected=[''];
creatorCache['Seek Citizenship'].effect={};
creatorCache['Seek Citizenship'].effect.game=\`finish() {
        towns[4].finishProgress(this.varName, 100);
    }\`;
creatorCache['Seek Citizenship'].effect.pred=\`\`;
creatorCache['Build Housing']={};
creatorCache['Build Housing'].affected=[''];
creatorCache['Build Housing'].canStart={};
creatorCache['Build Housing'].canStart.game=\`canStart() {
        let maxHouses = Math.floor(getCraftGuildRank().bonus * getSkillMod("Spatiomancy",0,500,1));
        return guild === "Crafting" && towns[4].getLevel("Citizen") >= 100 && resources.houses < maxHouses;
    }\`;
creatorCache['Build Housing'].canStart.pred=\`(input) => {
          return ((input.guild=='crafting') && ((input.houses||0) < Math.floor(h.getGuildRankBonus(input.crafts || 0) * (1 + Math.min( getSkillLevelFromExp(skills.Spatiomancy.exp),500) * .01))));
        }\`;
creatorCache['Build Housing'].effect={};
creatorCache['Build Housing'].effect.skills={};	
creatorCache['Build Housing'].effect.skills.Crafting=100,
creatorCache['Build Housing'].effect.game=\`finish() {
        addResource("houses", 1);
        handleSkillExp(this.skills);
    }\`;
creatorCache['Build Housing'].effect.pred=\`(r) => (r.houses = (r.houses ? r.houses+1 : 1))\`;
creatorCache['Collect Taxes']={};
creatorCache['Collect Taxes'].affected=[''];
creatorCache['Collect Taxes'].canStart={};
creatorCache['Collect Taxes'].canStart.game=\`canStart() {
        return resources.houses > 0;
    }\`;
creatorCache['Collect Taxes'].canStart.pred=\`(input) => (input.houses > 0)\`;
creatorCache['Collect Taxes'].effect={};
creatorCache['Collect Taxes'].effect.game=\`finish() {
        const goldGain = Math.floor(resources.houses * getSkillLevel("Mercantilism") / 10);
        addResource("gold", goldGain);
        return goldGain;
    }\`;
creatorCache['Collect Taxes'].effect.pred=\`(r, k) => {
          r.gold += Math.floor(r.houses *  getSkillLevelFromExp(k.mercantilism) / 10);
        }\`;
creatorCache['Pegasus']={};
creatorCache['Pegasus'].affected=['gold','favor'];
creatorCache['Pegasus'].canStart={};
creatorCache['Pegasus'].canStart.game=\`canStart() {
        return resources.gold >= 200 && resources.favors >= 20;
    }\`;
creatorCache['Pegasus'].canStart.pred=\`(input) => {
          return (input.gold >= 200 && input.favor >= 20);
        }\`;
creatorCache['Pegasus'].effect={};
creatorCache['Pegasus'].effect.cost=\`cost() {
        addResource("favors", -20);
        addResource("gold", -200);
    }\`;
creatorCache['Pegasus'].effect.game=\`finish() {
        addResource("pegasus", true);
    }\`;
creatorCache['Pegasus'].effect.pred=\`(r) => {
          r.gold -= 200;
          r.favor -= 20;
          r.pegasus = true;
        }\`;
creatorCache['Great Feast']={};
creatorCache['Great Feast'].affected=['feast','soul'];
creatorCache['Great Feast'].canStart={};
creatorCache['Great Feast'].canStart.game=\`canStart() {
        return resources.reputation >= 100 && towns[this.townNum].GreatFeastLoopCounter === 0 && checkSoulstoneSac(this.goldCost()) && getBuffLevel("Feast") < parseInt(document.getElementById("buffFeastCap").value);
    }\`;
creatorCache['Great Feast'].canStart.pred=\`(input) => (input.rep >= 100)\`;
creatorCache['Great Feast'].loop={};
creatorCache['Great Feast'].loop.cost={};
creatorCache['Great Feast'].loop.cost.game=\`loopCost(segment) {
        return 1000000000 * (segment * 5 + 1);
    }\`;
creatorCache['Great Feast'].loop.cost.pred=\`(p) => segment => 1000000000 * (segment * 5 + 1)\`;
creatorCache['Great Feast'].loop.tick={};
creatorCache['Great Feast'].loop.tick.game=\`tickProgress(offset) {
        return getSkillLevel("Practical") * (1 + getLevel(this.loopStats[(towns[4].GreatFeastLoopCounter + offset) % this.loopStats.length]) / 100);
    }\`;
creatorCache['Great Feast'].loop.tick.pred=\`(p, a, s, k) => offset => {
            return  getSkillLevelFromExp(k.practical) * h.getStatProgress(p, a, s, offset);
          }\`;
creatorCache['Great Feast'].loop.end={};
creatorCache['Great Feast'].loop.end.game=\`finish() {
        view.requestUpdate("updateBuff", "Feast");
    }\`;
creatorCache['Great Feast'].loop.end.pred=\`\`;
creatorCache['Great Feast'].loop.loop={};
creatorCache['Great Feast'].loop.loop.game=\`loopsFinished() {
        sacrificeSoulstones(this.goldCost());
        addBuffAmt("Feast", 1);
        view.requestUpdate("updateSoulstones", null);
        view.requestUpdate("adjustGoldCost", {varName: "GreatFeast", cost: this.goldCost()});
    }\`;
creatorCache['Great Feast'].loop.loop.pred=\`(r) => {
            r.feast++;
            let ssCost = Action.GreatFeast.goldCost();
            r.nonDungeonSS -= ssCost;
            r.soul -= ssCost;
          }\`;
creatorCache['Great Feast'].loop.max=\`() => 1\`;
creatorCache['Fight Frost Giants']={};
creatorCache['Fight Frost Giants'].affected=['giants'];
creatorCache['Fight Frost Giants'].canStart={};
creatorCache['Fight Frost Giants'].canStart.game=\`canStart() {
        return resources.pegasus;
    }\`;
creatorCache['Fight Frost Giants'].canStart.pred=\`(input) => (input.pegasus)\`;
creatorCache['Fight Frost Giants'].loop={};
creatorCache['Fight Frost Giants'].loop.cost={};
creatorCache['Fight Frost Giants'].loop.cost.game=\`loopCost(segment) {
        return precision3(Math.pow(1.3, towns[4]['@{this.varName}LoopCounter'] + segment)) * 1e7; // Temp
    }\`;
creatorCache['Fight Frost Giants'].loop.cost.pred=\`(p, a) => segment => precision3(Math.pow(1.3, (p.completed + a.segments)) * 1e7)\`;
creatorCache['Fight Frost Giants'].loop.tick={};
creatorCache['Fight Frost Giants'].loop.tick.game=\`tickProgress(offset) {
        return (getSelfCombat() *
            (1 + getLevel(this.loopStats[(towns[4]['@{this.varName}LoopCounter'] + offset) % this.loopStats.length]) / 100) *
            Math.sqrt(1 + towns[4]['total@{this.varName}'] / 1000));
    }\`;
creatorCache['Fight Frost Giants'].loop.tick.pred=\`(p, a, s, k, r) => offset => h.getSelfCombat(r, k) * Math.sqrt(1 + p.total / 100) * h.getStatProgress(p, a, s, offset)\`;
creatorCache['Fight Frost Giants'].loop.end={};
creatorCache['Fight Frost Giants'].loop.end.skills={};	
creatorCache['Fight Frost Giants'].loop.end.skills.Combat=1500,
creatorCache['Fight Frost Giants'].loop.end.game=\`finish() {
    }\`;
creatorCache['Fight Frost Giants'].loop.end.pred=\`\`;
creatorCache['Fight Frost Giants'].loop.segment={};
creatorCache['Fight Frost Giants'].loop.segment.game=\`segmentFinished() {
        curFightFrostGiantsSegment++;
        // Additional thing?
    }\`;
creatorCache['Fight Frost Giants'].loop.segment.pred=\`(r) => r.giants= (r.giants||0)+1\`;
creatorCache['Fight Frost Giants'].loop.loop={};
creatorCache['Fight Frost Giants'].loop.loop.game=\`loopsFinished() {
        handleSkillExp(this.skills);
    }\`;
creatorCache['Fight Frost Giants'].loop.loop.pred=\`(r,k) => {(k.combat += 1500*(1+getBuffLevel("Heroism") * 0.02))}\`;
creatorCache['Fight Frost Giants'].loop.max=\`\`;
creatorCache['Seek Blessing']={};
creatorCache['Seek Blessing'].affected=['giants'];
creatorCache['Seek Blessing'].canStart={};
creatorCache['Seek Blessing'].canStart.game=\`canStart() {
        return resources.pegasus;
    }\`;
creatorCache['Seek Blessing'].canStart.pred=\`(input) => {
          return (input.pegasus);
        }\`;
creatorCache['Seek Blessing'].effect={};
creatorCache['Seek Blessing'].effect.skills={};	
creatorCache['Seek Blessing'].effect.skills.Divine=50,
creatorCache['Seek Blessing'].effect.game=\`finish() {
        this.skills.Divine = Math.floor(50 * getFrostGiantsRank().bonus);
        handleSkillExp(this.skills);
    }\`;
creatorCache['Seek Blessing'].effect.pred=\`(r, k) => {
          k.divine+= (r.giants>62? 10: precision3(1 + 0.05 * Math.pow(r.giants||0, 1.05)) ) *50;
          r.giants=0;
        }\`;
creatorCache['Fall From Grace']={};
creatorCache['Fall From Grace'].affected=[''];
creatorCache['Fall From Grace'].effect={};
creatorCache['Fall From Grace'].effect.game=\`finish() {
        if (resources.reputation >= 0) resources.reputation = -1;
        view.requestUpdate("updateResource", 'reputation');
        unlockStory("fellFromGrace");
        unlockTown(5);
    }\`;
creatorCache['Fall From Grace'].effect.pred=\`(r) => {
          if (r.rep >= 0) {
            r.rep = -1;
          }
          r.town=5;
        }\`;
creatorCache['Meander']={};
creatorCache['Meander'].affected=[''];
creatorCache['Meander'].effect={};
creatorCache['Meander'].effect.game=\`finish() {
        towns[5].finishProgress(this.varName, getBuffLevel("Imbuement"));
    }\`;
creatorCache['Meander'].effect.pred=\`\`;
creatorCache['Mana Well']={};
creatorCache['Mana Well'].affected=[''];
creatorCache['Mana Well'].manaCost={};
creatorCache['Mana Well'].manaCost.game=\`manaCost() {
        return Math.ceil(2500 * getSkillBonus("Spatiomancy"));
    }\`;
creatorCache['Mana Well'].manaCost.pred=\`\`;
creatorCache['Mana Well'].canStart={};
creatorCache['Mana Well'].canStart.game=\`canStart() {
        return true;
    }\`;
creatorCache['Mana Well'].canStart.pred=\`true\`;
creatorCache['Mana Well'].effect={};
creatorCache['Mana Well'].effect.game=\`finish() {
        towns[5].finishRegular(this.varName, 100, () => {
        let wellMana = Math.max(5000 - Math.floor(10 * effectiveTime), 0);
        addMana(wellMana);
        return wellMana;
        });
    }\`;
creatorCache['Mana Well'].effect.pred=\`(r,k)=> {
            r.wellLoot = (r.wellLoot || 0) + 1;
            r.mana += r.wellLoot <= towns[5].goodWells ? Math.max(5000 - Math.floor(r.totalTicks/5),0) : 0;
          }\`;
creatorCache['Destroy Pylons']={};
creatorCache['Destroy Pylons'].affected=['pylons'];
creatorCache['Destroy Pylons'].effect={};
creatorCache['Destroy Pylons'].effect.game=\`finish() {
        towns[5].finishRegular(this.varName, 100, () => {
            addResource("pylons", 1);
            view.requestUpdate("adjustManaCost", "The Spire");
            return 1;
        });
    }\`;
creatorCache['Destroy Pylons'].effect.pred=\`(r) => {
          r.pylonLoot = (r.pylonLoot || 0) + 1;
          if (r.pylonLoot<=towns[5].goodPylons) {
            r.pylons += 1;
          }
        }\`;
creatorCache['Raise Zombie']={};
creatorCache['Raise Zombie'].affected=['blood','zombie'];
creatorCache['Raise Zombie'].canStart={};
creatorCache['Raise Zombie'].canStart.game=\`canStart() {
        return resources.blood >= 1;
    }\`;
creatorCache['Raise Zombie'].canStart.pred=\`(input) => (input.blood >= 1)\`;
creatorCache['Raise Zombie'].effect={};
creatorCache['Raise Zombie'].effect.skills={};	
creatorCache['Raise Zombie'].effect.skills.Dark=100,
creatorCache['Raise Zombie'].effect.cost=\`cost() {
        addResource("blood", -1);
    }\`;
creatorCache['Raise Zombie'].effect.game=\`finish() {
        handleSkillExp(this.skills);
        addResource("zombie", 1);
    }\`;
creatorCache['Raise Zombie'].effect.pred=\`(r) => {
            r.blood -= 1;
            r.zombie += 1;
          }\`;
creatorCache['Dark Sacrifice']={};
creatorCache['Dark Sacrifice'].affected=['blood'];
creatorCache['Dark Sacrifice'].canStart={};
creatorCache['Dark Sacrifice'].canStart.game=\`canStart() {
        return resources.blood >= 1;
    }\`;
creatorCache['Dark Sacrifice'].canStart.pred=\`(input) => (input.blood >= 1)\`;
creatorCache['Dark Sacrifice'].effect={};
creatorCache['Dark Sacrifice'].effect.skills={};	
creatorCache['Dark Sacrifice'].effect.skills.Commune=100,
creatorCache['Dark Sacrifice'].effect.cost=\`cost() {
        addResource("blood", -1);
    }\`;
creatorCache['Dark Sacrifice'].effect.game=\`finish() {
        handleSkillExp(this.skills);
        view.requestUpdate("adjustGoldCost", {varName: "DarkRitual", cost: Action.DarkRitual.goldCost()});
    }\`;
creatorCache['Dark Sacrifice'].effect.pred=\`(r,k) => (r.blood -=1,k.commune+=100)\`;
creatorCache['The Spire']={};
creatorCache['The Spire'].affected=['soul'];
creatorCache['The Spire'].canStart={};
creatorCache['The Spire'].canStart.game=\`canStart() {
        const curFloor = Math.floor((towns[this.townNum].TheSpireLoopCounter) / this.segments + 0.0000001);
        return curFloor < dungeons[this.dungeonNum].length;
    }\`;
creatorCache['The Spire'].canStart.pred=\`true\`;
creatorCache['The Spire'].loop={};
creatorCache['The Spire'].loop.cost={};
creatorCache['The Spire'].loop.cost.game=\`loopCost(segment) {
        return precision3(Math.pow(2, Math.floor((towns[this.townNum].TheSpireLoopCounter + segment) / this.segments + 0.0000001)) * 1e7);
    }\`;
creatorCache['The Spire'].loop.cost.pred=\`(p, a) => segment =>  precision3(Math.pow(2, Math.floor((p.completed + segment) / a.segments + .0000001)) * 10000000)\`;
creatorCache['The Spire'].loop.tick={};
creatorCache['The Spire'].loop.tick.game=\`tickProgress(offset) {
        const floor = Math.floor((towns[this.townNum].TheSpireLoopCounter) / this.segments + 0.0000001);
        return getTeamCombat() * (1 + 0.1 * resources.pylons) *
        (1 + getLevel(this.loopStats[(towns[this.townNum].TheSpireLoopCounter + offset) % this.loopStats.length]) / 100) *
        Math.sqrt(1 + dungeons[this.dungeonNum][floor].completed / 200);
    }\`;
creatorCache['The Spire'].loop.tick.pred=\`(p, a, s, k, r) => offset => {
            const floor = Math.floor(p.completed / a.segments + .0000001);

            return floor in  dungeons[a.dungeonNum] ?
                h.getTeamCombat(r, k) *
                (1 + 0.1 * (r.pylons||0)) *
                h.getStatProgress(p, a, s, offset) *
                Math.sqrt(1 +  dungeons[a.dungeonNum][floor].completed / 200) : 0;
          }\`;
creatorCache['The Spire'].loop.end={};
creatorCache['The Spire'].loop.end.skills={};	
creatorCache['The Spire'].loop.end.skills.Combat=100,
creatorCache['The Spire'].loop.end.game=\`finish() {
        handleSkillExp(this.skills);
        view.requestUpdate("updateBuff", "Aspirant");
    }\`;
creatorCache['The Spire'].loop.end.pred=\`(r,k) => {(k.combat += 100*(1+getBuffLevel("Heroism") * 0.02))}\`;
creatorCache['The Spire'].loop.loop={};
creatorCache['The Spire'].loop.loop.game=\`loopsFinished() {
        const curFloor = Math.floor((towns[this.townNum].TheSpireLoopCounter) / this.segments + 0.0000001 - 1);
        finishDungeon(this.dungeonNum, curFloor);
        if (curFloor >= getBuffLevel("Aspirant")) addBuffAmt("Aspirant", 1);
    }\`;
creatorCache['The Spire'].loop.loop.pred=\`(r) => {
            let ssGained = h.getRewardSS(2);
            r.completionsTheSpire = (r.completionsTheSpire || 0) + 1;
            r.soul += ssGained;
            r.expectedSS += ssGained * dungeons[2][r.completionsTheSpire - 1].ssChance;
          }\`;
creatorCache['The Spire'].loop.max=\`(a) =>  dungeons[a.dungeonNum].length\`;
creatorCache['Purchase Supplies']={};
creatorCache['Purchase Supplies'].affected=['gold'];
creatorCache['Purchase Supplies'].canStart={};
creatorCache['Purchase Supplies'].canStart.game=\`canStart() {
        return resources.gold >= 500 && !resources.supplies;
    }\`;
creatorCache['Purchase Supplies'].canStart.pred=\`(input) => (input.gold >= 500 && !input.supplies)\`;
creatorCache['Purchase Supplies'].effect={};
creatorCache['Purchase Supplies'].effect.cost=\`cost() {
        addResource("gold", -500);
    }\`;
creatorCache['Purchase Supplies'].effect.game=\`finish() {
        addResource("supplies", true);
    }\`;
creatorCache['Purchase Supplies'].effect.pred=\`(r) => {
          r.gold -= 500;
          r.supplies = (r.supplies || 0) + 1;
        }\`;
creatorCache['Dead Trial']={};
creatorCache['Dead Trial'].affected=['zombie'];
creatorCache['Dead Trial'].canStart={};
creatorCache['Dead Trial'].canStart.game=\`canStart() {
        return this.currentFloor() < trialFloors[this.trialNum];
    }\`;
creatorCache['Dead Trial'].canStart.pred=\`true\`;
creatorCache['Dead Trial'].loop={};
creatorCache['Dead Trial'].loop.cost={};
creatorCache['Dead Trial'].loop.cost.game=\`function(segment) {
    return precision3(Math.pow(this.baseScaling, Math.floor((towns[this.townNum]['@{this.varName}LoopCounter'] + segment) / this.segments + 0.0000001)) * this.exponentScaling * getSkillBonus("Assassin"));
}\`;
creatorCache['Dead Trial'].loop.cost.pred=\`(p, a) => segment => precision3(Math.pow(a.baseScaling, Math.floor((p.completed + segment) / a.segments + .0000001)) * a.exponentScaling * getSkillBonus("Assassin"))\`;
creatorCache['Dead Trial'].loop.tick={};
creatorCache['Dead Trial'].loop.tick.game=\`function(offset) {
    return this.baseProgress() *
        (1 + getLevel(this.loopStats[(towns[this.townNum]['@{this.varName}LoopCounter'] + offset) % this.loopStats.length]) / 100) *
        Math.sqrt(1 + trials[this.trialNum][this.currentFloor()].completed / 200);
}\`;
creatorCache['Dead Trial'].loop.tick.pred=\`(p, a, s, k, r) => offset => {
            const floor = Math.floor(p.completed / a.segments + .0000001);
            return floor in trials[a.trialNum] ? h.getZombieStrength(r, k) * h.getStatProgress(p, a, s, offset) * Math.sqrt(1 + trials[a.trialNum][floor].completed / 200) : 0;
          }\`;
creatorCache['Dead Trial'].loop.end={};
creatorCache['Dead Trial'].loop.end.game=\`finish() {
    }\`;
creatorCache['Dead Trial'].loop.end.pred=\`\`;
creatorCache['Dead Trial'].loop.loop={};
creatorCache['Dead Trial'].loop.loop.game=\`function() {
    const finishedFloor = this.currentFloor() - 1;
    //console.log("Finished floor: " + finishedFloor + " Current Floor: " + this.currentFloor());
    trials[this.trialNum][finishedFloor].completed++;
    if (finishedFloor > trials[this.trialNum].highestFloor || trials[this.trialNum].highestFloor === undefined) trials[this.trialNum].highestFloor = finishedFloor;
    view.requestUpdate("updateTrialInfo", {trialNum: this.trialNum, curFloor: this.currentFloor()});
    this.floorReward();
}\`;
creatorCache['Dead Trial'].loop.loop.pred=\`(r) => (r.zombie++)\`;
creatorCache['Dead Trial'].loop.max=\`(a) => trialFloors[a.trialNum]\`;
creatorCache['Journey Forth']={};
creatorCache['Journey Forth'].affected=[''];
creatorCache['Journey Forth'].canStart={};
creatorCache['Journey Forth'].canStart.game=\`canStart() {
        return resources.supplies;
    }\`;
creatorCache['Journey Forth'].canStart.pred=\`(input) => (input.supplies >= 1)\`;
creatorCache['Journey Forth'].effect={};
creatorCache['Journey Forth'].effect.cost=\`cost() {
        addResource("supplies", false);
    }\`;
creatorCache['Journey Forth'].effect.game=\`finish() {
        unlockTown(6);
    }\`;
creatorCache['Journey Forth'].effect.pred=\`(r) => {
            r.supplies--;
            r.town=6;
        }\`;
creatorCache['Explore Jungle']={};
creatorCache['Explore Jungle'].affected=['herbs'];
creatorCache['Explore Jungle'].effect={};
creatorCache['Explore Jungle'].effect.game=\`finish() {
        towns[6].finishProgress(this.varName, 20 * getFightJungleMonstersRank().bonus);
        addResource("herbs", 1);
    }\`;
creatorCache['Explore Jungle'].effect.pred=\`(r) => (r.herbs++)\`;
creatorCache['Fight Jungle Monsters']={};
creatorCache['Fight Jungle Monsters'].affected=['blood'];
creatorCache['Fight Jungle Monsters'].canStart={};
creatorCache['Fight Jungle Monsters'].canStart.game=\`canStart() {
        return true;
    }\`;
creatorCache['Fight Jungle Monsters'].canStart.pred=\`true\`;
creatorCache['Fight Jungle Monsters'].loop={};
creatorCache['Fight Jungle Monsters'].loop.cost={};
creatorCache['Fight Jungle Monsters'].loop.cost.game=\`loopCost(segment) {
        return precision3(Math.pow(1.3, towns[6]['@{this.varName}LoopCounter'] + segment)) * 1e8; // Temp
    }\`;
creatorCache['Fight Jungle Monsters'].loop.cost.pred=\`(p, a) => segment =>  precision3(Math.pow(1.3, p.completed + segment)) * 1e8\`;
creatorCache['Fight Jungle Monsters'].loop.tick={};
creatorCache['Fight Jungle Monsters'].loop.tick.game=\`tickProgress(offset) {
        return (getSelfCombat() *
            (1 + getLevel(this.loopStats[(towns[6]['@{this.varName}LoopCounter'] + offset) % this.loopStats.length]) / 100) *
            Math.sqrt(1 + towns[6]['total@{this.varName}'] / 1000));
    }\`;
creatorCache['Fight Jungle Monsters'].loop.tick.pred=\`(p, a, s, k, r) => offset => h.getSelfCombat(r, k) * h.getStatProgress(p, a, s, offset) *
                                             Math.sqrt(1 + p.total / 1000)\`;
creatorCache['Fight Jungle Monsters'].loop.end={};
creatorCache['Fight Jungle Monsters'].loop.end.skills={};	
creatorCache['Fight Jungle Monsters'].loop.end.skills.Combat=2000,
creatorCache['Fight Jungle Monsters'].loop.end.game=\`finish() {
    }\`;
creatorCache['Fight Jungle Monsters'].loop.end.pred=\`\`;
creatorCache['Fight Jungle Monsters'].loop.segment={};
creatorCache['Fight Jungle Monsters'].loop.segment.game=\`segmentFinished() {
        curFightJungleMonstersSegment++;
        addResource("blood", 1);
        // Additional thing?
    }\`;
creatorCache['Fight Jungle Monsters'].loop.segment.pred=\`(r) => r.blood=(r.blood||0)+1\`;
creatorCache['Fight Jungle Monsters'].loop.loop={};
creatorCache['Fight Jungle Monsters'].loop.loop.game=\`loopsFinished() {
        handleSkillExp(this.skills);
    }\`;
creatorCache['Fight Jungle Monsters'].loop.loop.pred=\`(r,k)=> (k.combat+=2000*(1+getBuffLevel("Heroism") * 0.02))\`;
creatorCache['Fight Jungle Monsters'].loop.max=\`\`;
creatorCache['Rescue Survivors']={};
creatorCache['Rescue Survivors'].affected=[''];
creatorCache['Rescue Survivors'].canStart={};
creatorCache['Rescue Survivors'].canStart.game=\`canStart() {
        return true;
    }\`;
creatorCache['Rescue Survivors'].canStart.pred=\`true\`;
creatorCache['Rescue Survivors'].loop={};
creatorCache['Rescue Survivors'].loop.cost={};
creatorCache['Rescue Survivors'].loop.cost.game=\`loopCost(segment) {
        return fibonacci(2 + Math.floor((towns[6].RescueLoopCounter + segment) / this.segments + 0.0000001)) * 5000;
    }\`;
creatorCache['Rescue Survivors'].loop.cost.pred=\`(p, a) => segment =>  fibonacci(2 + Math.floor((p.completed + segment) / a.segments + .0000001)) * 5000\`;
creatorCache['Rescue Survivors'].loop.tick={};
creatorCache['Rescue Survivors'].loop.tick.game=\`tickProgress(offset) {
        return getSkillLevel("Magic") * Math.max(getSkillLevel("Restoration") / 100, 1) * (1 + getLevel(this.loopStats[(towns[6].RescueLoopCounter + offset) % this.loopStats.length]) / 100) * Math.sqrt(1 + towns[6].totalRescue / 100);
    }\`;
creatorCache['Rescue Survivors'].loop.tick.pred=\`(p, a, s, k) => offset =>  getSkillLevelFromExp(k.magic) * Math.max( getSkillLevelFromExp(k.restoration) / 100, 1) * h.getStatProgress(p, a, s, offset) * Math.sqrt(1 + p.total / 100)\`;
creatorCache['Rescue Survivors'].loop.end={};
creatorCache['Rescue Survivors'].loop.end.skills={};	
creatorCache['Rescue Survivors'].loop.end.skills.Restoration=25,
creatorCache['Rescue Survivors'].loop.end.game=\`finish() {
        handleSkillExp(this.skills);
    }\`;
creatorCache['Rescue Survivors'].loop.end.pred=\`(r,k) => { (k.restoration += 25*(1+getBuffLevel("Heroism") * 0.02))}\`;
creatorCache['Rescue Survivors'].loop.segment={};
creatorCache['Rescue Survivors'].loop.segment.pred=\`(r,k) => (r.survivor= (r.survivor||0)+1)\`;
creatorCache['Rescue Survivors'].loop.loop={};
creatorCache['Rescue Survivors'].loop.loop.game=\`loopsFinished() {
        addResource("reputation", 4);
    }\`;
creatorCache['Rescue Survivors'].loop.loop.pred=\`(r) => (r.survivor= (r.survivor||0)+1,r.rep+=4)\`;
creatorCache['Rescue Survivors'].loop.max=\`\`;
creatorCache['Prepare Buffet']={};
creatorCache['Prepare Buffet'].affected=['herbs','blood'];
creatorCache['Prepare Buffet'].canStart={};
creatorCache['Prepare Buffet'].canStart.game=\`canStart() {
        return resources.herbs >= 10 && resources.blood > 0;
    }\`;
creatorCache['Prepare Buffet'].canStart.pred=\`(input) => ((input.herbs>=10) && (input.blood>=1))\`;
creatorCache['Prepare Buffet'].effect={};
creatorCache['Prepare Buffet'].effect.skills={};	
creatorCache['Prepare Buffet'].effect.skills.Alchemy=25,	
creatorCache['Prepare Buffet'].effect.skills.Gluttony=5,
creatorCache['Prepare Buffet'].effect.cost=\`cost() {
        addResource("herbs", -10);
        addResource("blood", -1);
    }\`;
creatorCache['Prepare Buffet'].effect.game=\`finish() {
        this.skills.Gluttony = Math.floor(towns[6].RescueLoopCounter * 5);
        handleSkillExp(this.skills);
    }\`;
creatorCache['Prepare Buffet'].effect.pred=\`(r,k) => {
            r.herbs-=10;
            r.blood--;
            k.gluttony+=5*r.survivor;
          }\`;
creatorCache['Totem']={};
creatorCache['Totem'].affected=['lpotions'];
creatorCache['Totem'].canStart={};
creatorCache['Totem'].canStart.game=\`canStart() {
        return resources.loopingPotion;
    }\`;
creatorCache['Totem'].canStart.pred=\`(input)=>(input.lpotions>0)\`;
creatorCache['Totem'].effect={};
creatorCache['Totem'].effect.skills={};	
creatorCache['Totem'].effect.skills.Wunderkind=100,
creatorCache['Totem'].effect.cost=\`cost() {
        addResource("loopingPotion", false);
    }\`;
creatorCache['Totem'].effect.game=\`finish() {
        handleSkillExp(this.skills);
    }\`;
creatorCache['Totem'].effect.pred=\`(r,k)=>(r.lpotions--,k.wunderkind+=100)\`;
creatorCache['Escape']={};
creatorCache['Escape'].affected=[''];
creatorCache['Escape'].canStart={};
creatorCache['Escape'].canStart.game=\`canStart() {
        if (escapeStarted) return true;
        else if (effectiveTime < 60) {
            escapeStarted = true;
            return true;
        }
        else return false;
    }\`;
creatorCache['Escape'].canStart.pred=\`(input) => (input.totalTicks<=50*60)\`;
creatorCache['Escape'].effect={};
creatorCache['Escape'].effect.game=\`finish() {
        unlockTown(7);
    }\`;
creatorCache['Escape'].effect.pred=\`(r) => (r.town=7)\`;
creatorCache['Open Portal']={};
creatorCache['Open Portal'].affected=[''];
creatorCache['Open Portal'].effect={};
creatorCache['Open Portal'].effect.skills={};	
creatorCache['Open Portal'].effect.skills.Restoration=2500,
creatorCache['Open Portal'].effect.game=\`finish() {
        portalUsed = true;
        handleSkillExp(this.skills);
        unlockTown(1);
    }\`;
creatorCache['Open Portal'].effect.pred=\`(r,k) => (r.town=1,k.restoration+=2500*(1+getBuffLevel("Heroism") * 0.02))\`;
creatorCache['Excursion']={};
creatorCache['Excursion'].affected=['gold'];
creatorCache['Excursion'].canStart={};
creatorCache['Excursion'].canStart.game=\`canStart() {
        return resources.gold >= this.goldCost();
    }\`;
creatorCache['Excursion'].canStart.pred=\`(input) => {
          return input.gold>=(((input.guild==='explorer')||(input.guild==='thieves')) >= 0 ? 2 : 10);
        }\`;
creatorCache['Excursion'].effect={};
creatorCache['Excursion'].effect.game=\`finish() {
        towns[7].finishProgress(this.varName, 50 * (resources.glasses ? 2 : 1));
        addResource("gold", -1 * this.goldCost());
    }\`;
creatorCache['Excursion'].effect.pred=\`(r, k) => {
          r.gold -= (((r.guild==='explorer')||(r.guild==='thieves')) ? 2 : 10);
        }\`;
creatorCache['Explorers Guild']={};
creatorCache['Explorers Guild'].affected=['map','completedMap'];
creatorCache['Explorers Guild'].canStart={};
creatorCache['Explorers Guild'].canStart.game=\`canStart() {
        return guild === "";
    }\`;
creatorCache['Explorers Guild'].canStart.pred=\`(input) => (input.guild=='')\`;
creatorCache['Explorers Guild'].effect={};
creatorCache['Explorers Guild'].effect.game=\`finish() {
        if (getExploreSkill() == 0) towns[this.townNum].finishProgress("SurveyZ"+this.townNum, 100);
        if (resources.map === 0) addResource("map", 30);
        if (resources.completedMap > 0) exchangeMap();
        guild = "Explorer";
        view.requestUpdate("adjustGoldCost", {varName: "Excursion", cost: Action.Excursion.goldCost()});
    }\`;
creatorCache['Explorers Guild'].effect.pred=\`(r,k) => {
          r.submittedMap=r.completedMap;
          r.completedMap=0;
          r.guild='explorer';
          if (r.map==0) {
            r.map=30;
          }
        }\`;
creatorCache['Thieves Guild']={};
creatorCache['Thieves Guild'].affected=['gold','thieves'];
creatorCache['Thieves Guild'].canStart={};
creatorCache['Thieves Guild'].canStart.game=\`canStart() {
        return guild === "" && resources.reputation < 0;
    }\`;
creatorCache['Thieves Guild'].canStart.pred=\`(input) => {
          return ((input.rep < 0) && (input.guild==''));
        }\`;
creatorCache['Thieves Guild'].loop={};
creatorCache['Thieves Guild'].loop.cost={};
creatorCache['Thieves Guild'].loop.cost.game=\`loopCost(segment) {
        return precision3(Math.pow(1.2, towns[7]['@{this.varName}LoopCounter'] + segment)) * 5e8;
    }\`;
creatorCache['Thieves Guild'].loop.cost.pred=\`(p) => segment =>  precision3(Math.pow(1.2, p.completed + segment)) * 5e8\`;
creatorCache['Thieves Guild'].loop.tick={};
creatorCache['Thieves Guild'].loop.tick.game=\`tickProgress(offset) {
        return (getSkillLevel("Practical") +
                getSkillLevel("Thievery")) *
                (1 + getLevel(this.loopStats[(towns[7]['@{this.varName}LoopCounter'] + offset) % this.loopStats.length]) / 100) *
                Math.sqrt(1 + towns[7]['total@{this.varName}'] / 1000);
    }\`;
creatorCache['Thieves Guild'].loop.tick.pred=\`(p, a, s, k, r) => offset => ( getSkillLevelFromExp(k.practical) +  getSkillLevelFromExp(k.thievery)) * h.getStatProgress(p, a, s, offset) * Math.sqrt(1 + p.total / 1000)\`;
creatorCache['Thieves Guild'].loop.end={};
creatorCache['Thieves Guild'].loop.end.skills={};	
creatorCache['Thieves Guild'].loop.end.skills.Thievery=50,	
creatorCache['Thieves Guild'].loop.end.skills.Practical=50,
creatorCache['Thieves Guild'].loop.end.game=\`finish() {
        guild = "Thieves";
        view.requestUpdate("adjustGoldCost", {varName: "Excursion", cost: Action.Excursion.goldCost()});
        handleSkillExp(this.skills);
    }\`;
creatorCache['Thieves Guild'].loop.end.pred=\`(r, k) => (r.guild='thieves',k.practical+=50,k.thievery+=50)\`;
creatorCache['Thieves Guild'].loop.segment={};
creatorCache['Thieves Guild'].loop.segment.game=\`segmentFinished() {
        curThievesGuildSegment++;
        handleSkillExp(this.skills);
        addResource("gold", 10);
    }\`;
creatorCache['Thieves Guild'].loop.segment.pred=\`(r,k) => (r.gold += 10, r.thieves=( r.thieves||0)+1,k.practical+=50,k.thievery+=50)\`;
creatorCache['Thieves Guild'].loop.loop={};
creatorCache['Thieves Guild'].loop.loop.game=\`loopsFinished() {
    }\`;
creatorCache['Thieves Guild'].loop.loop.pred=\`\`;
creatorCache['Thieves Guild'].loop.max=\`\`;
creatorCache['Pick Pockets']={};
creatorCache['Pick Pockets'].affected=[''];
creatorCache['Pick Pockets'].canStart={};
creatorCache['Pick Pockets'].canStart.game=\`canStart() {
        return guild === "Thieves";
    }\`;
creatorCache['Pick Pockets'].canStart.pred=\`(input) => (input.guild==='thieves')\`;
creatorCache['Pick Pockets'].effect={};
creatorCache['Pick Pockets'].effect.skills={};	
creatorCache['Pick Pockets'].effect.skills.Thievery=\`Thievery() {
            return 10 * (1 + towns[7].getLevel("PickPockets") / 100);
        }\`,
creatorCache['Pick Pockets'].effect.game=\`finish() {
        towns[7].finishProgress(this.varName, 30 * getThievesGuildRank().bonus);
        handleSkillExp(this.skills);
        view.requestUpdate("adjustExpGain", Action.ThievesGuild);
        const goldGain = Math.floor(this.goldCost() * getThievesGuildRank().bonus);
        addResource("gold", goldGain);
        return goldGain;
    }\`;
creatorCache['Pick Pockets'].effect.pred=\`(r, k) => {
          r.gold += Math.floor(Math.floor(2 * h.getSkillBonusInc(k.thievery)) * h.getGuildRankBonus(r.thieves));
          k.thievery+=10 * (1 + towns[7].getLevel("PickPockets") / 100);
        }\`;
creatorCache['Rob Warehouse']={};
creatorCache['Rob Warehouse'].affected=[''];
creatorCache['Rob Warehouse'].canStart={};
creatorCache['Rob Warehouse'].canStart.game=\`canStart() {
        return guild === "Thieves";
    }\`;
creatorCache['Rob Warehouse'].canStart.pred=\`(input) => (input.guild==='thieves')\`;
creatorCache['Rob Warehouse'].effect={};
creatorCache['Rob Warehouse'].effect.skills={};	
creatorCache['Rob Warehouse'].effect.skills.Thievery=\`Thievery() {
            return 20 * (1 + towns[7].getLevel("RobWarehouse") / 100);
        }\`,
creatorCache['Rob Warehouse'].effect.game=\`finish() {
        towns[7].finishProgress(this.varName, 20 * getThievesGuildRank().bonus);
        handleSkillExp(this.skills);
        view.requestUpdate("adjustExpGain", Action.ThievesGuild);
        const goldGain = Math.floor(this.goldCost() * getThievesGuildRank().bonus);
        addResource("gold", goldGain);
        return goldGain;
    }\`;
creatorCache['Rob Warehouse'].effect.pred=\`(r, k) => {
          r.gold += Math.floor(Math.floor(20 * h.getSkillBonusInc(k.thievery)) * h.getGuildRankBonus(r.thieves));
          k.thievery+=20 * (1 + towns[7].getLevel("RobWarehouse") / 100);
        }\`;
creatorCache['Insurance Fraud']={};
creatorCache['Insurance Fraud'].affected=[''];
creatorCache['Insurance Fraud'].canStart={};
creatorCache['Insurance Fraud'].canStart.game=\`canStart() {
        return guild === "Thieves";
    }\`;
creatorCache['Insurance Fraud'].canStart.pred=\`(input) => (input.guild==='thieves')\`;
creatorCache['Insurance Fraud'].effect={};
creatorCache['Insurance Fraud'].effect.skills={};	
creatorCache['Insurance Fraud'].effect.skills.Thievery=\`Thievery() {
            return 40 * (1 + towns[7].getLevel("InsuranceFraud") / 100);
        }\`,
creatorCache['Insurance Fraud'].effect.game=\`finish() {
        towns[7].finishProgress(this.varName, 10 * getThievesGuildRank().bonus);
        handleSkillExp(this.skills);
        view.requestUpdate("adjustExpGain", Action.ThievesGuild);
        const goldGain = Math.floor(this.goldCost() * getThievesGuildRank().bonus);
        addResource("gold", goldGain);
        return goldGain;
    }\`;
creatorCache['Insurance Fraud'].effect.pred=\`(r, k) => {
          r.gold += Math.floor(Math.floor(200 * h.getSkillBonusInc(k.thievery)) * h.getGuildRankBonus(r.thieves));
          k.thievery+=40 * (1 + towns[7].getLevel("InsuranceFraud") / 100);
        }\`;
creatorCache['Guild Assassin']={};
creatorCache['Guild Assassin'].affected=['heart'];
creatorCache['Guild Assassin'].canStart={};
creatorCache['Guild Assassin'].canStart.game=\`canStart() {
        return guild === "";
    }\`;
creatorCache['Guild Assassin'].canStart.pred=\`(input) => (input.guild=='')\`;
creatorCache['Guild Assassin'].effect={};
creatorCache['Guild Assassin'].effect.skills={};	
creatorCache['Guild Assassin'].effect.skills.Assassin=100,
creatorCache['Guild Assassin'].effect.game=\`finish() {
        let assassinExp = 0;
        if (getSkillLevel("Assassin") === 0) assassinExp = 100;
        if (resources.heart > 0) assassinExp = 100 * Math.pow(resources.heart, 2);
        this.skills.Assassin = assassinExp;
        handleSkillExp(this.skills);
        resources.heart = 0;
        guild = "Assassin";
    }\`;
creatorCache['Guild Assassin'].effect.pred=\`(r,k) => {
          k.assassin+=100*Math.pow(r.heart,2);
          r.heart=0;
          r.guild='assassin';
        }\`;
creatorCache['Invest']={};
creatorCache['Invest'].affected=['gold'];
creatorCache['Invest'].canStart={};
creatorCache['Invest'].canStart.game=\`canStart() {
        return resources.gold > 0;
    }\`;
creatorCache['Invest'].canStart.pred=\`(input)=>(input.gold>0)\`;
creatorCache['Invest'].effect={};
creatorCache['Invest'].effect.skills={};	
creatorCache['Invest'].effect.skills.Mercantilism=100,
creatorCache['Invest'].effect.game=\`finish() {
        handleSkillExp(this.skills);
        goldInvested += resources.gold;
        if (goldInvested > 999999999999) goldInvested = 999999999999;
        resetResource("gold");
        view.requestUpdate("updateActionTooltips", null);
    }\`;
creatorCache['Invest'].effect.pred=\`(r,k)=> {
           k.mercantilism+=100;
           r.invested=r.gold;
           r.gold=0;
        }\`;
creatorCache['Collect Interest']={};
creatorCache['Collect Interest'].affected=['gold'];
creatorCache['Collect Interest'].canStart={};
creatorCache['Collect Interest'].canStart.game=\`canStart() {
        return true;
    }\`;
creatorCache['Collect Interest'].canStart.pred=\`true\`;
creatorCache['Collect Interest'].effect={};
creatorCache['Collect Interest'].effect.skills={};	
creatorCache['Collect Interest'].effect.skills.Mercantilism=50,
creatorCache['Collect Interest'].effect.game=\`finish() {
        handleSkillExp(this.skills);
        let interestGold = Math.floor(goldInvested * .001);
        addResource("gold", interestGold);
        return interestGold;
    }\`;
creatorCache['Collect Interest'].effect.pred=\`(r,k)=> {
           k.mercantilism+=50;
           r.gold+=Math.floor(goldInvested * .001);
        }\`;
creatorCache['Seminar']={};
creatorCache['Seminar'].affected=['gold'];
creatorCache['Seminar'].canStart={};
creatorCache['Seminar'].canStart.game=\`canStart() {
        return resources.gold >= 1000;
    }\`;
creatorCache['Seminar'].canStart.pred=\`(input)=>(input.gold>=1000)\`;
creatorCache['Seminar'].effect={};
creatorCache['Seminar'].effect.skills={};	
creatorCache['Seminar'].effect.skills.Leadership=200,
creatorCache['Seminar'].effect.cost=\`cost() {
        addResource("gold", -1000);
    }\`;
creatorCache['Seminar'].effect.game=\`finish() {
        handleSkillExp(this.skills);
    }\`;
creatorCache['Seminar'].effect.pred=\`(r,k)=> {
           k.leadership+=200;
           r.gold-=1000;
        }\`;
creatorCache['Purchase Key']={};
creatorCache['Purchase Key'].affected=['gold'];
creatorCache['Purchase Key'].canStart={};
creatorCache['Purchase Key'].canStart.game=\`canStart() {
        return resources.gold >= 1000000 && !resources.key;
    }\`;
creatorCache['Purchase Key'].canStart.pred=\`(input)=>(input.gold>=1000000)\`;
creatorCache['Purchase Key'].effect={};
creatorCache['Purchase Key'].effect.cost=\`cost() {
        addResource("gold", -1000000);
    }\`;
creatorCache['Purchase Key'].effect.game=\`finish() {
        addResource("key", true);
    }\`;
creatorCache['Purchase Key'].effect.pred=\`(r,k)=> {
           r.gold-=1000000;
           r.key=1;
        }\`;
creatorCache['Secret Trial']={};
creatorCache['Secret Trial'].affected=['zombie'];
creatorCache['Secret Trial'].canStart={};
creatorCache['Secret Trial'].canStart.game=\`canStart() {
        return this.currentFloor() < trialFloors[this.trialNum];
    }\`;
creatorCache['Secret Trial'].canStart.pred=\`true\`;
creatorCache['Secret Trial'].loop={};
creatorCache['Secret Trial'].loop.cost={};
creatorCache['Secret Trial'].loop.cost.game=\`function(segment) {
    return precision3(Math.pow(this.baseScaling, Math.floor((towns[this.townNum]['@{this.varName}LoopCounter'] + segment) / this.segments + 0.0000001)) * this.exponentScaling * getSkillBonus("Assassin"));
}\`;
creatorCache['Secret Trial'].loop.cost.pred=\`(p, a) => segment => precision3(Math.pow(a.baseScaling, Math.floor((p.completed + segment) / a.segments + .0000001)) * a.exponentScaling * getSkillBonus("Assassin"))\`;
creatorCache['Secret Trial'].loop.tick={};
creatorCache['Secret Trial'].loop.tick.game=\`function(offset) {
    return this.baseProgress() *
        (1 + getLevel(this.loopStats[(towns[this.townNum]['@{this.varName}LoopCounter'] + offset) % this.loopStats.length]) / 100) *
        Math.sqrt(1 + trials[this.trialNum][this.currentFloor()].completed / 200);
}\`;
creatorCache['Secret Trial'].loop.tick.pred=\`(p, a, s, k, r) => offset => {
            const floor = Math.floor(p.completed / a.segments + .0000001);
            if (!p.progress) p.teamCombat = h.getTeamCombat(r, k);
            return floor in trials[a.trialNum] ? p.teamCombat * h.getStatProgress(p, a, s, offset) * Math.sqrt(1 + trials[a.trialNum][floor].completed / 200) : 0;
          }\`;
creatorCache['Secret Trial'].loop.end={};
creatorCache['Secret Trial'].loop.end.game=\`finish() {
    }\`;
creatorCache['Secret Trial'].loop.end.pred=\`\`;
creatorCache['Secret Trial'].loop.loop={};
creatorCache['Secret Trial'].loop.loop.game=\`function() {
    const finishedFloor = this.currentFloor() - 1;
    //console.log("Finished floor: " + finishedFloor + " Current Floor: " + this.currentFloor());
    trials[this.trialNum][finishedFloor].completed++;
    if (finishedFloor > trials[this.trialNum].highestFloor || trials[this.trialNum].highestFloor === undefined) trials[this.trialNum].highestFloor = finishedFloor;
    view.requestUpdate("updateTrialInfo", {trialNum: this.trialNum, curFloor: this.currentFloor()});
    this.floorReward();
}\`;
creatorCache['Secret Trial'].loop.loop.pred=\`\`;
creatorCache['Secret Trial'].loop.max=\`(a) => trialFloors[a.trialNum]\`;
creatorCache['Leave City']={};
creatorCache['Leave City'].affected=[''];
creatorCache['Leave City'].canStart={};
creatorCache['Leave City'].canStart.game=\`canStart() {
        return resources.key;
    }\`;
creatorCache['Leave City'].canStart.pred=\`(input)=>(input.key>0)\`;
creatorCache['Leave City'].effect={};
creatorCache['Leave City'].effect.cost=\`cost() {
        addResource("key", false);
    }\`;
creatorCache['Leave City'].effect.game=\`finish() {
        unlockTown(8);
    }\`;
creatorCache['Leave City'].effect.pred=\`(r,k)=> {
           r.key=0;
           r.town=8;
        }\`;
creatorCache['Imbue Soul']={};
creatorCache['Imbue Soul'].affected=['body'];
creatorCache['Imbue Soul'].canStart={};
creatorCache['Imbue Soul'].canStart.game=\`canStart() {
        return towns[8].ImbueSoulLoopCounter === 0 && getBuffLevel("Imbuement") > 499 && getBuffLevel("Imbuement2") > 499 && getBuffLevel("Imbuement3") < 7;
    }\`;
creatorCache['Imbue Soul'].canStart.pred=\`true\`;
creatorCache['Imbue Soul'].loop={};
creatorCache['Imbue Soul'].loop.cost={};
creatorCache['Imbue Soul'].loop.cost.game=\`loopCost(segment) {
        return 100000000 * (segment * 5 + 1);
    }\`;
creatorCache['Imbue Soul'].loop.cost.pred=\`(p) => segment => 100000000 * (segment * 5 + 1)\`;
creatorCache['Imbue Soul'].loop.tick={};
creatorCache['Imbue Soul'].loop.tick.game=\`tickProgress(offset) {
        return getSkillLevel("Magic") * (1 + getLevel(this.loopStats[(towns[8].ImbueSoulLoopCounter + offset) % this.loopStats.length]) / 100);
    }\`;
creatorCache['Imbue Soul'].loop.tick.pred=\`(p, a, s, k) => offset => {
            let attempt = Math.floor(p.completed / a.segments + .0000001);

            return attempt < 1 ? ( getSkillLevelFromExp(k.magic) * h.getStatProgress(p, a, s, offset)) : 0;
          }\`;
creatorCache['Imbue Soul'].loop.end={};
creatorCache['Imbue Soul'].loop.end.game=\`finish() {
        view.requestUpdate("updateBuff", "Imbuement3");
        capAllTraining();
        adjustTrainingExpMult();
    }\`;
creatorCache['Imbue Soul'].loop.end.pred=\`\`;
creatorCache['Imbue Soul'].loop.loop={};
creatorCache['Imbue Soul'].loop.loop.game=\`loopsFinished() {
        for (const stat in stats) {
            stats[stat].talent = 0;
            stats[stat].soulstone = 0;
            view.requestUpdate("updateStat", stat);
        }
        buffs["Imbuement"].amt = 0;
        buffs["Imbuement2"].amt = 0;
        trainingLimits = 10;
        addBuffAmt("Imbuement3", 1);
        view.updateBuffs();
        view.updateStats();
        view.requestUpdate("updateSoulstones", null);
    }\`;
creatorCache['Imbue Soul'].loop.loop.pred=\`(r) => r.body++\`;
creatorCache['Imbue Soul'].loop.max=\`() => 1\`;
creatorCache['Build Tower']={};
creatorCache['Build Tower'].affected=['stone'];
creatorCache['Build Tower'].canStart={};
creatorCache['Build Tower'].canStart.game=\`canStart() {
        return resources.stone;
    }\`;
creatorCache['Build Tower'].canStart.pred=\`(input)=>((input.stone||0)==1)\`;
creatorCache['Build Tower'].effect={};
creatorCache['Build Tower'].effect.game=\`finish() {
        stonesUsed[stoneLoc]++;
        towns[this.townNum].finishProgress(this.varName, 505);
        addResource("stone", false);
        if (towns[this.townNum].getLevel(this.varName) >= 100) stonesUsed = {1:250, 3:250, 5:250, 6:250};
        adjustRocks(stoneLoc);
    }\`;
creatorCache['Build Tower'].effect.pred=\`(r,k)=>(r.stone=0)\`;
creatorCache['Gods Trial']={};
creatorCache['Gods Trial'].affected=['power'];
creatorCache['Gods Trial'].canStart={};
creatorCache['Gods Trial'].canStart.game=\`canStart() {
        return this.currentFloor() < trialFloors[this.trialNum] && resources.power < 7;
    }\`;
creatorCache['Gods Trial'].canStart.pred=\`true\`;
creatorCache['Gods Trial'].loop={};
creatorCache['Gods Trial'].loop.cost={};
creatorCache['Gods Trial'].loop.cost.game=\`function(segment) {
    return precision3(Math.pow(this.baseScaling, Math.floor((towns[this.townNum]['@{this.varName}LoopCounter'] + segment) / this.segments + 0.0000001)) * this.exponentScaling * getSkillBonus("Assassin"));
}\`;
creatorCache['Gods Trial'].loop.cost.pred=\`(p, a) => segment => precision3(Math.pow(a.baseScaling, Math.floor((p.completed + segment) / a.segments + .0000001)) * a.exponentScaling * getSkillBonus("Assassin"))\`;
creatorCache['Gods Trial'].loop.tick={};
creatorCache['Gods Trial'].loop.tick.game=\`function(offset) {
    return this.baseProgress() *
        (1 + getLevel(this.loopStats[(towns[this.townNum]['@{this.varName}LoopCounter'] + offset) % this.loopStats.length]) / 100) *
        Math.sqrt(1 + trials[this.trialNum][this.currentFloor()].completed / 200);
}\`;
creatorCache['Gods Trial'].loop.tick.pred=\`(p, a, s, k, r) => offset => {
            const floor = Math.floor(p.completed / a.segments + .0000001);
            return floor in trials[a.trialNum] ? h.getTeamCombat(r, k) * h.getStatProgress(p, a, s, offset) * Math.sqrt(1 + trials[a.trialNum][floor].completed / 200) : 0;
          }\`;
creatorCache['Gods Trial'].loop.end={};
creatorCache['Gods Trial'].loop.end.skills={};	
creatorCache['Gods Trial'].loop.end.skills.Combat=250,	
creatorCache['Gods Trial'].loop.end.skills.Pyromancy=50,	
creatorCache['Gods Trial'].loop.end.skills.Restoration=50,
creatorCache['Gods Trial'].loop.end.game=\`finish() {
        handleSkillExp(this.skills);
    }\`;
creatorCache['Gods Trial'].loop.end.pred=\`(r,k) => (k.combat+=250*(1+getBuffLevel("Heroism") * 0.02),k.pyromancy+=50*(1+getBuffLevel("Heroism") * 0.02),k.restoration+=50*(1+getBuffLevel("Heroism") * 0.02))\`;
creatorCache['Gods Trial'].loop.loop={};
creatorCache['Gods Trial'].loop.loop.game=\`function() {
    const finishedFloor = this.currentFloor() - 1;
    //console.log("Finished floor: " + finishedFloor + " Current Floor: " + this.currentFloor());
    trials[this.trialNum][finishedFloor].completed++;
    if (finishedFloor > trials[this.trialNum].highestFloor || trials[this.trialNum].highestFloor === undefined) trials[this.trialNum].highestFloor = finishedFloor;
    view.requestUpdate("updateTrialInfo", {trialNum: this.trialNum, curFloor: this.currentFloor()});
    this.floorReward();
}\`;
creatorCache['Gods Trial'].loop.loop.pred=\`(r) => {
            r.godFloor=(r.godFloor||0)+1;
            if (r.godFloor==99) {
              r.power=1;
            }
          }\`;
creatorCache['Gods Trial'].loop.max=\`(a) => trialFloors[a.trialNum]\`;
creatorCache['Challenge Gods']={};
creatorCache['Challenge Gods'].affected=['power'];
creatorCache['Challenge Gods'].canStart={};
creatorCache['Challenge Gods'].canStart.game=\`canStart() {
        return this.currentFloor() < trialFloors[this.trialNum] && resources.power > 0 && resources.power < 8;
    }\`;
creatorCache['Challenge Gods'].canStart.pred=\`(input)=>(input.power>0)\`;
creatorCache['Challenge Gods'].loop={};
creatorCache['Challenge Gods'].loop.cost={};
creatorCache['Challenge Gods'].loop.cost.game=\`function(segment) {
    return precision3(Math.pow(this.baseScaling, Math.floor((towns[this.townNum]['@{this.varName}LoopCounter'] + segment) / this.segments + 0.0000001)) * this.exponentScaling * getSkillBonus("Assassin"));
}\`;
creatorCache['Challenge Gods'].loop.cost.pred=\`(p, a) => segment => precision3(Math.pow(a.baseScaling, Math.floor((p.completed + segment) / a.segments + .0000001)) * a.exponentScaling * getSkillBonus("Assassin"))\`;
creatorCache['Challenge Gods'].loop.tick={};
creatorCache['Challenge Gods'].loop.tick.game=\`function(offset) {
    return this.baseProgress() *
        (1 + getLevel(this.loopStats[(towns[this.townNum]['@{this.varName}LoopCounter'] + offset) % this.loopStats.length]) / 100) *
        Math.sqrt(1 + trials[this.trialNum][this.currentFloor()].completed / 200);
}\`;
creatorCache['Challenge Gods'].loop.tick.pred=\`(p, a, s, k, r) => offset => {
            const floor = Math.floor(p.completed / a.segments + .0000001);
            return floor in trials[a.trialNum] ? h.getSelfCombat(r, k) * h.getStatProgress(p, a, s, offset) * Math.sqrt(1 + trials[a.trialNum][floor].completed / 200) : 0;
          }\`;
creatorCache['Challenge Gods'].loop.end={};
creatorCache['Challenge Gods'].loop.end.skills={};	
creatorCache['Challenge Gods'].loop.end.skills.Combat=500,
creatorCache['Challenge Gods'].loop.end.game=\`finish() {
        handleSkillExp(this.skills);
    }\`;
creatorCache['Challenge Gods'].loop.end.pred=\`(r,k) => (k.combat+=500*(1+getBuffLevel("Heroism") * 0.02))\`;
creatorCache['Challenge Gods'].loop.loop={};
creatorCache['Challenge Gods'].loop.loop.game=\`function() {
    const finishedFloor = this.currentFloor() - 1;
    //console.log("Finished floor: " + finishedFloor + " Current Floor: " + this.currentFloor());
    trials[this.trialNum][finishedFloor].completed++;
    if (finishedFloor > trials[this.trialNum].highestFloor || trials[this.trialNum].highestFloor === undefined) trials[this.trialNum].highestFloor = finishedFloor;
    view.requestUpdate("updateTrialInfo", {trialNum: this.trialNum, curFloor: this.currentFloor()});
    this.floorReward();
}\`;
creatorCache['Challenge Gods'].loop.loop.pred=\`(r) => (r.power++)\`;
creatorCache['Challenge Gods'].loop.max=\`(a) => trialFloors[a.trialNum]\`;
creatorCache['Restore Time']={};
creatorCache['Restore Time'].affected=['power','rep'];
creatorCache['Restore Time'].canStart={};
creatorCache['Restore Time'].canStart.game=\`canStart() {
        return resources.power >= 8;
    }\`;
creatorCache['Restore Time'].canStart.pred=\`(input)=>(input.power>=8)\`;
creatorCache['Restore Time'].effect={};
creatorCache['Restore Time'].effect.game=\`finish() {
        addResource("reputation", 9999999);
    }\`;
creatorCache['Restore Time'].effect.pred=\`(r)=> (r.rep+=9999999)\`;


//END CACHE File
`); //`

