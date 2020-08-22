/*******************************************************************************
pc steering wheel animated viewer
probably firefox only
2019-08-10 19:55 +0000
/******************************************************************************/

console.log('wheel');

let interval;


/*
// chrome compatibility
if(!('ongamepadconnected' in window)) {
    console.log('no event');
    interval = setInterval( z=>{
        console.log('polling');
        window.dispatchEvent(new CustomEvent('gamepadconnected'))
    }, 1000);
}
*/


let device;
let dataDisplay;
let showDisplay;

// mapping the axes
let axisIndexWheel     = 0;
let axisIndexThrottle  = 1;
let axisIndexBrake     = 2;
let axisIndexClutch    = 3;
let axisIndexClutchAlt = 5;

// mapping the buttons
let btnIndexR1 = 11;
let btnIndexF1 = 12;
let btnIndexF2 = 13;
let btnIndexF3 = 14;
let btnIndexF4 = 15;
let btnIndexF5 = 16;
let btnIndexF6 = 17;

// elements references
let elemWheel;
let elemThrottle;
let elemBrake;
let elemClutch;
let elemGearStick;

// misc
let axisWheelFullRotation = 900; // degrees

let loopStartTime = (new Date()).getTime();
let loopEndTime   = (new Date()).getTime();

//let renderRate = 1000/100;


//******************************************************************************
window.addEventListener('DOMContentLoaded', function(e) {

    console.log('loaded');

    // style: convert vw into px for scalability with pixel perfect alignment
    let xhr = new XMLHttpRequest();
    xhr.open('GET', './wheelScalable.css', true);
    xhr.responseType = 'text';
    xhr.onload = function(data){

        let val = data.target.responseText;

        // get unit ref for pixel perfect consistency
        let unit = Math.floor(
            window.getComputedStyle(
                document.getElementById('unitRef')
            )
            .getPropertyValue('width')
            .match(/([\d\.]+)/)[1]
        );

        let r = /([^\d])([\d\.]+)(\s*vw)/g;

        let m;
        while(m = r.exec(val)) {

            val = val.replace(
                new RegExp(m[0], 'g')
                ,m[1]+ unit * parseInt(m[2]) +'px'
            );
        }

        let s = document.createElement('style');
        s.textContent = val;
        document.head.appendChild(s);
    }
    xhr.send();


    dataDisplay   = document.getElementById('dataDisplay');
    showDisplay   = document.getElementById('showDisplay');
    elemWheel     = document.getElementById('wheel');
    elemThrottle  = document.querySelector('#throttle > span');
    elemBrake     = document.querySelector('#brake > span');
    elemClutch    = document.querySelector('#clutch > span');
    elemGearStick = document.querySelector('#gearStick');

    /*
    window.addEventListener('gamepadconnected', function(e) {
        if(e.gamepad.id.match(/g920.*wheel/i)) {
            wheelDevice = e.gamepad;
            gameLoop();
            return;
        }
    });
    */

    gameLoop();
});


//******************************************************************************
function gameLoop() {

    /* framerate limiter *
    loopStartTime = (new Date()).getTime();

    let delta = loopStartTime-loopEndTime;
    if(delta < renderRate) {
        requestAnimationFrame(gameLoop);
        return;
    }
    console.log('render delta: '+delta+'ms')
    */

    wheelDevice = null;
    let gps = navigator.getGamepads();
    for(let gp of gps) {

        if(gp && gp.id.match(/g920.*wheel/i)) {
            wheelDevice = gp;
            break;
        }
    }

    if(wheelDevice) {

        //******************************************************* data gathering
        let axisValueWheel    = wheelDevice.axes[axisIndexWheel];
        let axisValueThrottle = wheelDevice.axes[axisIndexThrottle];
        let axisValueBrake    = wheelDevice.axes[axisIndexBrake];
        //let axisValueClutch   = wheelDevice.axes[axisIndexClutch];
        let axisValueClutch   = wheelDevice.axes[axisIndexClutch] || wheelDevice.axes[axisIndexClutchAlt];

        // convert wheel axis to angle
        axisValueWheel = Math.round(axisWheelFullRotation / 2 * axisValueWheel * 1000) / 1000;

        // normalize pedals axes to range 0-1
        axisValueThrottle = (axisValueThrottle * -1 + 1) / 2;
        axisValueBrake    = (axisValueBrake    * -1 + 1) / 2;
        axisValueClutch   = (axisValueClutch   * -1 + 1) / 2;

        //********************************************************* data display

        let debugText = '-';

        if(showDisplay.checked) {

            debugText = '\n[id]\n    '+wheelDevice.id+'\n';

            debugText += '\n[Axes]';
            wheelDevice.axes.forEach((a,i)=>{
                debugText += "\n    "+i+' : '+a;
            });

            debugText += '\n\n[Buttons]';
            wheelDevice.buttons.forEach((b,i)=>{
                debugText += "\n    "+i+' : pressed:'+b.pressed+' touched:'+b.touched;
            });

            debugText = '<pre>\n[Computed]\n'
                    +'      wheel: '+axisValueWheel   +'deg\n'
                    +'    thottle: '+axisValueThrottle+'\n'
                    +'      brake: '+axisValueBrake   +'\n'
                    +'     clutch: '+axisValueClutch  +'\n'
                +'</pre>'
                +'<pre>'+debugText+'</pre>'
            ;
        }
        dataDisplay.innerHTML = debugText;



        //************************************************************** visuals

        axisValueWheel = 'rotate('+axisValueWheel+'deg)';
        if(elemWheel.style.transform != axisValueWheel) {
            elemWheel.style.transform = axisValueWheel;
        }

        axisValueThrottle = (100 - axisValueThrottle * 100)+'%';
        if(elemThrottle.style.height != axisValueThrottle) {
            elemThrottle.style.height = axisValueThrottle;
        }

        axisValueBrake = (100 - axisValueBrake * 100)+'%';
        if(elemBrake.style.height != axisValueBrake) {
            elemBrake.style.height = axisValueBrake;
        }

        axisValueClutch = (100 - axisValueClutch * 100)+'%';
        if(elemClutch.style.height != axisValueClutch) {
            elemClutch.style.height = axisValueClutch;
        }

        let gearStickClass = ''
            +(wheelDevice.buttons[btnIndexR1].pressed ? ' gearR1' : '')
            +(wheelDevice.buttons[btnIndexF1].pressed ? ' gearF1' : '')
            +(wheelDevice.buttons[btnIndexF2].pressed ? ' gearF2' : '')
            +(wheelDevice.buttons[btnIndexF3].pressed ? ' gearF3' : '')
            +(wheelDevice.buttons[btnIndexF4].pressed ? ' gearF4' : '')
            +(wheelDevice.buttons[btnIndexF5].pressed ? ' gearF5' : '')
            +(wheelDevice.buttons[btnIndexF6].pressed ? ' gearF6' : '')
        ;

        if(elemGearStick.classList != gearStickClass) {
            elemGearStick.classList = gearStickClass
        }

    }

    //loopEndTime = (new Date()).getTime();

    requestAnimationFrame(gameLoop);




    /*
    let angle = Math.round(wheelFullRotation / 2 * axis0value * 1000) / 1000;

    nodeAxis0.textContent = axis0value+' : '+angle+'deg';

    wheelGfx.style.transform = 'rotate('+angle+'deg)';

    */
    //transform: rotate(20deg);


    /*
    var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
    if (!gamepads) {
    return;
    }

    var gp = gamepads[0];
    if (buttonPressed(gp.buttons[0])) {
    b--;
    } else if (buttonPressed(gp.buttons[2])) {
    b++;
    }
    if (buttonPressed(gp.buttons[1])) {
    a++;
    } else if (buttonPressed(gp.buttons[3])) {
    a--;
    }

    ball.style.left = a * 2 + "px";
    ball.style.top = b * 2 + "px";
    */

}