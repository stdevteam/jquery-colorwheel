(function($) {
    var colorWheelInstanceExist = false,
    handlerIterator = 1;
    // jQuery plugin definition  
    $.fn.colorWheel = function(options){
        if(colorWheelInstanceExist === false){
            // merge default and user parameters
            options = $.extend($.fn.colorWheel.defaults, options);
            // traverse all nodes
            this.each(function() {
                // express a single node as a jQuery object
                var $this = $(this);
                $.fn.colorWheel.handlers[handlerIterator] = new ColorWheelHandler(/*$this*/);
                $this.data('handlersIndex', handlerIterator);
                $.fn.colorWheel.handlers[handlerIterator].init($this, options);
            });
            //allow only one instance
            if(options.enableKeyboardShortcuts === true){
                colorWheelInstanceExist = true;
            }
            handlerIterator++;
        }
        // allow jQuery chaining
        return this;
    };
    //Default params for wheel
    $.fn.colorWheel.defaults = {
        controlsSelector: '.wheel-controls',//selector to append color wheel controls to
        wheelWidth: 553,//width for current wheel, ratio will be preserved
        pickedColorLables: ['Picked color'],//identifies labels for picked colors also how many colors can be picked
        initialColors: [
            "#222222", "#444444", "#666666", "#888888", "#999999", "#aaaaaa",  "#bbbbbb", "#cccccc", "#dddddd", "#eeeeee"
        ],//colors that will be used to prefil picked colors area initially
        addInputs: true,//weather or not to add inputs with color codes to picked color
        addLabels: true,//weather or not to add labels to picked colors containers
        enableKeyboardShortcuts: true,//weather or not to enable keyboard shortcuts
        pickContElement: 'div',//element for single picker container
        pickLabelElement: 'strong',//element for single picker label, used only if 'addLabels' is set to true
        pickTextElement: 'span',//element for single picker texts
        pickItemTitleText: 'Click to change this color'
        //Text to use for title of picker item, usually indicates thet if clicked will change this color
    };
    //Handlers holder property
    $.fn.colorWheel.handlers = [];
    /**
     * Handles color wheel processing
     * @class 
     * @property {Number} hue The hue value for color processing
     */
    var ColorWheelHandler = function(element){
        /*var $element = $(element);
        // Attach the instance of this object
        // to the jQuery wrapped DOM node
        $element.data('colorWheelHandler', this);*/
        /**
         * Internal holder of current instance
         * @type ColorWheelHandler
         */
        this.$this = null,
        /**
         * The hue of color
         * @type Number
         */
        this.hue = 60;
        /**
         * A degree
         * @type Number
         */
        this.adeg = 60;
        /**
         * The saturation
         * @type Number
         */
        this.saturation = 1,
        /**
         * The value
         * @type Number
         */
        this.value = 1,
        /**
         * The initial value for wheel width
         * @type Number
         */
        this.initialWidth = 553;
        /**
         * The initial value for wheel height
         * @type Number
         */
        this.initialHeight = 257;
        /**
         * A multiplier used for adjustments when default width and height of wheel where changed
         * @type Number
         */
        this.multiplier = 1;
        /**
         * The starting hue
         * @type String
         */
        this.squarecolor = "#ffff00",
        /**
         * The index of current picked color
         * @type Number
         */
        this.pickindex = 0,
        /**
         * Element name for picked colors containers inner elements, 'input' if addInputs = true 'span' otherwise
         * @type String
         */
        this.colorContInnerElement = 'span';
        /**
         * The starting three colors
         * @type String[]
         */
        this.threeColors = new Array("#666666", "#555555", "#545657"),
        /**
         * The previous color
         * @type String
         */
        this.prevColor = null,
        /**
         * Ids of picked colors containers
         * @type String[]
         */
        this.pickedColors = [],
        /**
         * The initial value for picked colors
         * @type String[]
         */
        this.initialColors = [],
        /**
         * A jQuery object for wheel container
         * @type Object
         */
        this.$wheel = null,
        /**
         * A jQuery object for wheel cotrols container
         * @type Object
         */
        this.$controls = null,
        /**
         * An object containing plugin options
         * @type Object
         */
        this.options = {},
        /**
         * Initiation function
         * @param {Object} $wheelObject jQuery object of entire wheel container
         * @param {Object} options An object contianing merged options
         */
        this.init = function($wheelObject, options){
            this.$wheel = $wheelObject;
            //Set the options
            this.options = options;
            //Set width changes
            this.processWheelDimensions();
            //Process controls container
            this.processControlsArea();
            //Process picked colors containers
            this.processColorContainers();
            
            this.prevColor = this.threeColors[2];
            this.bindHandlers();
            this.$this = this;
        },
        /**
         * Handles all plugin options assignment
         * @param {Object} options The options object
         */
        this.setOptions = function(options){
            this.options = options;
        },
        /**
         * Sets the index of currently changable color
         * @param {Number} index The index to set
         */
        this.setPickIndex = function(index){
            this.pickindex = index;
        },
        /**
         * Retrieves a particular option from options list
         * @param {String} option The option key
         * @returns {Mixed} The value for option or null if option is does not exist
         */
        this.getOption = function(option){
            if(typeof this.options.option != 'undefined'){
                return this.options.option;
            }else{
                return null;
            }
        },
        /**
         * Inititalizes key handlers and color handlers and mouse move event trackers
         */
        this.bindHandlers = function(){
            //if shortcuts needs to be enabled
            if(this.options.enableKeyboardShortcuts){
                // keypress stuff
                $(document).keydown(function(event){
                    //var handler = $(this).data('colorWheelHandler');
                    var handler = $.fn.colorWheel.handlers.slice(-1)[0];
                    handler.rotate(event);
                });
            }
            
            this.$wheel.click(function(event){
                //var handler = $(this).data('colorWheelHandler');
                var handler = $.fn.colorWheel.handlers[$(this).data('handlersIndex')];
                handler.pickColor(event);
            });
            
            
            // start capturing the mouse
           // this.hoverColor();
            this.$wheel.mousemove(function(event){
                //var handler = $(this).data('colorWheelHandler');
                var handler = $.fn.colorWheel.handlers[$(this).data('handlersIndex')];
                handler.mouseMoved(event);
            });
            
            //bind the mouseout
            this.$wheel.mouseout(function(event){
                var handler = $.fn.colorWheel.handlers[$(this).data('handlersIndex')];
                handler.wheelMouseOut(event);
            });
        },
        /**
         * Processes wheel controls area and apply defaults if no selector specified
         */
        this.processControlsArea = function(){
            this.$controls = $(this.options.controlsSelector);
            if(this.$controls.size() <= 0){
                alert("Control area selector needs to be specified");
                this.$wheel.after($('<div />').addClass($.fn.colorWheel.defaults.controlsSelector));
                this.options.controlsSelector = $.fn.colorWheel.defaults.controlsSelector;
                this.$controls = $("."+$.fn.colorWheel.defaults.controlsSelector);
            }
        },
        /**
         * Processes dimensions of wheel based on width specified in options
         */
        this.processWheelDimensions = function(){
            var options = this.options, realHeight;
            this.multiplier = this.initialWidth/options.wheelWidth;
            realHeight = this._divide(this.initialHeight);
            //Apply styles
            this.$wheel.css({
                width: options.wheelWidth,
                height: realHeight
            });
            this.$wheel.find('img').css({
                width: options.wheelWidth,
                height: realHeight
            });
        },
        /**
         * Processes containers for picked colors
         */
        this.processColorContainers = function(){
            //set initial colors
            this.initialColors = this.options.initialColors;
            
            var i,theContents, textElem = this.options.pickTextElement, contElem = this.options.pickContElement,
            labelElem = this.options.pickLabelElement,
            colorsIndex = 0,colorsSize = this.initialColors.length, 
            //set the pickset
            $pickSet = $('<div />').attr('id', 'pickset'), $tempPickerCont, $tempInput,$tempLabel,
            labels = this.options.pickedColorLables,
            pickerId = 'picker-'+this.getHandlerIndex()+'-';
            
            this.colorContInnerElement = ((this.options.addInputs)? 'input' : 'span');
            //check labels presence
            if(labels.length <= 0){
                alert('At least one label needs to be specified for \'pickedColorLables\'');
                labels = $.fn.colorWheel.defaults.pickedColorLables;
            }
            //iterate over labels
            var value;
            for(var index in labels){
                value = labels[index];
                $.fn.colorWheel.handlers[this.getHandlerIndex()].pickedColors.push({
                    id: pickerId+index,
                    label: value
                });
            }

            for(i = 0; i < this.pickedColors.length; i++){
                //set each picker container
                if(i >= colorsSize){
                    colorsIndex = colorsSize - i;
                }else{
                    colorsIndex = i;
                }
                $tempPickerCont = $('<'+contElem+' />')
                .attr('id', this.pickedColors[i].id)
                .attr('title', this.options.pickItemTitleText)
                .addClass('picker-item')
                .css({
                   'backgroundColor': this.initialColors[colorsIndex]
                });
                this.pickedColors[i].lastColor = this.initialColors[colorsIndex];
                theContents = '<'+textElem+' class="wtxt">' + this.initialColors[colorsIndex] 
                    +'</'+textElem+'><br><'+textElem+' class="btxt">' + this.initialColors[colorsIndex] +'</'+textElem+'>';
               // $tempPickerCont.append(theContents);
               if(this.options.addLabels){
                   $tempLabel = $("<"+labelElem+" />")
                   .attr('id', this.pickedColors[i].id+'-label')
                   .addClass('picker-item-label')
                   .text(this.pickedColors[i].label);
                
                    $tempPickerCont.append($tempLabel);
               }
                if(this.options.addInputs){
                    $tempInput = $("<input />")
                    .attr('id', this.pickedColors[i].id+'-color-cont')
                    .attr('name', this.pickedColors[i].id+'-color-cont')
                    .addClass('picker-item-color-cont')
                    .val(this.initialColors[colorsIndex]);
                }else{
                    $tempInput = $("<"+textElem+" />")
                    .attr('id', this.pickedColors[i].id+'-color-cont')
                    .addClass('picker-item-color-cont')
                    .text(this.initialColors[colorsIndex]);
                }
                $tempPickerCont.append($tempInput);
                //set the picker index and handler index
                $tempPickerCont.data('indexData', {
                    'pickerIndex': i,
                    'handlerIndex': this.getHandlerIndex()
                });
                
                $pickSet.append($tempPickerCont);
            }
            //Add pickset to controls
            this.$controls.append($pickSet);
            //Attach the click handler to all the picked colors containers
            $(".picker-item").click(function(){
                var data = $(this).data('indexData'),
                handler = $.fn.colorWheel.handlers[data.handlerIndex];
                handler.setPickIndex(data.pickerIndex);
            });
        }
        /**
         * Gets index for current handler
         * @returns {Number} Index for current handler
         */
        this.getHandlerIndex = function(){
            return this.$wheel.data('handlersIndex');
        }
        /**
         * HSV conversion algorithm
         * @param {Number} Hdeg The hue degree
         * @param {Number} S The saturationuration
         * @param {Number} V The value
         * @returns {Number[]} RGB valueu
         */
        this.hsv2rgb = function(Hdeg, S, V) {
            var H,R,G,B,var_h,var_i,var_1,var_2,var_3,var_r,var_g,var_b
            H = Hdeg/360;     // convert from degrees to 0 to 1
            if(S==0){       // HSV values = From 0 to 1
                R = V*255;     // RGB results = From 0 to 255
                G = V*255;
                B = V*255;
            }else{
                var_h = H*6;
                var_i = Math.floor( var_h );     //Or ... var_i = floor( var_h )
                var_1 = V*(1-S);
                var_2 = V*(1-S*(var_h-var_i));
                var_3 = V*(1-S*(1-(var_h-var_i)));
                if(var_i == 0){
                    var_r=V;
                    var_g=var_3;
                    var_b=var_1
                }else if (var_i==1){
                    var_r=var_2;
                    var_g=V;
                    var_b=var_1
                }else if (var_i==2){
                    var_r=var_1;
                    var_g=V;
                    var_b=var_3
                }else if (var_i==3){
                    var_r=var_1;
                    var_g=var_2;
                    var_b=V
                }else if (var_i==4){
                    var_r=var_3;
                    var_g=var_1;
                    var_b=V
                }else{
                    var_r=V;
                    var_g=var_1;
                    var_b=var_2
                }
                R = Math.round(var_r*255);   //RGB results = From 0 to 255
                G = Math.round(var_g*255);
                B = Math.round(var_b*255);
            }
            return new Array(R,G,B);
        },
        /**
         * Converts rgb color to hexadecimal representation
         * @param {String[]} rgbary An array of colors red,green,blue
         * @returns {Array} Returns hex color as an array of three two-digit strings 
         * plus the full hex color and original decimal values
         */
        this.rgb2hex = function(rgbary) {
            var cary,i;
            cary = new Array; 
            cary[3] = "#";
            for (i=0; i < 3; i++) {
                cary[i] = parseInt(rgbary[i]).toString(16);
                if (cary[i].length < 2) cary[i] = "0"+ cary[i];
                cary[3] = cary[3] + cary[i];
                cary[i+4] = rgbary[i]; //save dec values for later
            }
            return cary;
        },
        /**
         * Rounds rgb color values by applying safe or smart divisors
         * @param {Number[]} c An array of rgb color values
         * @param {Number} d The divisor, safe divisor is 51, smart divisor is 17 
         * @returns {String} Hexadecimal color plus # sign
         */
        this.webRounder = function(c, d) {
            var thec = "#",i,num,numc;
            for (i=0; i<3; i++) {
                num = Math.round(c[i+4]/d) * d; //use saved rgb value
                numc = num.toString(16);
                if (String(numc).length < 2) numc = "0" + numc;
                thec += numc;
            }
            return thec;
        },
        /**
         * Takes string hexadecimal value with # and saves it in web safe and smart versions
         * @param {String} c Hexadecimal string with #
         * @returns {Boolean} Returns false
         */
        this.hexColorArray = function(c) { //
            this.threeColors[2] = c[3];
            this.threeColors[1] = this.webRounder(c,17);
            this.threeColors[0] = this.webRounder(c,51);
            return false;
        },
        /**
         * Handler for mouse move on hue correction part of color chooser
         * @param {Number} x The x coordinate of mouse current position
         * @param {Number} y The y coordinate of mouse current position
         * @returns {Boolean} Returns false
         */
        this.greyMoved = function(x, y) {
            var xside, yside, c;
            this.adeg = this.hue;
            xside = (x<=553)?x - 296:256;
            yside = (y<=256)?y:256;
            this.saturation = xside/256;
            this.value = 1 - (yside/256);
            c = this.rgb2hex(this.hsv2rgb(this.hue,this.saturation,this.value));
            this.hexColorArray(c);
            this.hoverColor();
            return false;
        },
        /**
         * Respondes to mouse move events
         * @param {Event} e A jQuery Mouse move event
         */
        this.mouseMoved = function(e) {
            var offset = this.$wheel.offset();
            var x = this._multiply(e.pageX - offset.left),y = this._multiply(e.pageY - offset.top),
            cartx,carty,cartx2,carty2,cartxs,cartys,cartxn,rraw,rnorm,rgb,arad,aradc,c;

            if(x >= 296){
                this.greyMoved(x,y);
                return false;
            }
            if(y > 256){
                return false;
            }

            cartx = x - 128;
            carty = 128 - y;
            cartx2 = cartx * cartx;
            carty2 = carty * carty;
            cartxs = (cartx < 0)?-1:1;
            cartys = (carty < 0)?-1:1;
            cartxn = cartx/128;                      //normalize x
            rraw = Math.sqrt(cartx2 + carty2);       //raw radius
            rnorm = rraw/128;                        //normalized radius
            if (rraw == 0) {
                this.saturation = 0;
                this.value = 0;
                rgb = new Array(0,0,0);
            }else{
                arad = Math.acos(cartx/rraw);            //angle in radians 
                aradc = (carty>=0)?arad:2*Math.PI - arad;  //correct below axis
                this.adeg = 360 * aradc/(2*Math.PI);  //convert to degrees
                if (rnorm > 1) {    // outside circle
                    rgb = new Array(255,255,255);
                    this.saturation = 1;
                    this.value = 1;
                }else if (rnorm >= .5) {
                    this.saturation = 1 - ((rnorm - .5) *2);
                    this.value = 1;
                    rgb = this.hsv2rgb(this.adeg,this.saturation,this.value);
                }else{
                    this.saturation = 1;
                    this.value = rnorm * 2;
                    rgb = this.hsv2rgb(this.adeg,this.saturation,this.value);
                }
            }
            c = this.rgb2hex(rgb);
            this.hexColorArray(c);
            this.hoverColor();
            return false;
        },
        this.wheelMouseOut = function(){
            $("#"+this.pickedColors[this.pickindex].id).css({
                'backgroundColor': this.pickedColors[this.pickindex].lastColor
            });
            if(this.options.addInputs){
                $("#"+this.pickedColors[this.pickindex].id).find(this.colorContInnerElement).val(
                    this.pickedColors[this.pickindex].lastColor
                );
            }else{
                $("#"+this.pickedColors[this.pickindex].id).find(this.colorContInnerElement).text(
                    this.pickedColors[this.pickindex].lastColor
                );
            }
            
            
            return false;
        },
        /**
         * Apply current color after mouse move
         */
        this.hoverColor = function() {
            /*$("#demoa").css({'background': this.threeColors[0]});
            $("#demob").css({'background': this.threeColors[1]});
            $("#democ").css({'background': this.threeColors[2]});*/
            
            $("#"+this.pickedColors[this.pickindex].id).css({
                'backgroundColor': this.threeColors[1]
            });
            if(this.options.addInputs){
                $("#"+this.pickedColors[this.pickindex].id).find(this.colorContInnerElement).val(this.threeColors[1]);
            }else{
                $("#"+this.pickedColors[this.pickindex].id).find(this.colorContInnerElement).text(this.threeColors[1]);
            }
            
            
            return false;
        },
        /**
         * Applies picked color to next holder of picked color
         * @param {Event} event A jQuery Click event
         * @return {Boolean} Always returns false
         */
        this.pickColor = function(event) {
            var thecontents, thecolors;
            if(this.threeColors[2] == this.prevColor){
                return false; // prevent duplicate entries in list
            }
            this.prevColor = this.threeColors[2];
           /* thecontents = "<tt class='wtxt'>" + this.threeColors[1] +
                "</tt><br /><tt class='btxt'>" + this.threeColors[1] + "</tt>";*/
            /*thecolors = "<tt>" + this.threeColors[0] + "&nbsp;&nbsp;" + this.threeColors[1] + "&nbsp;&nbsp;" + this.threeColors[2] + 
                "</tt>&nbsp;&nbsp;<span style='background-color: " + this.threeColors[1] + 
                "; padding-left: 10px;'>&nbsp;</span><br />";*/

            //set current values
            
            if(this.options.addInputs){
                $("#"+this.pickedColors[this.pickindex].id).find(this.colorContInnerElement).val(this.threeColors[1]);
            }else{
                $("#"+this.pickedColors[this.pickindex].id).find(this.colorContInnerElement).text(this.threeColors[1]);
            }
            //$("#"+this.pickedColors[this.pickindex].id).html(thecontents);
            $("#"+this.pickedColors[this.pickindex].id).css({
                'backgroundColor': this.threeColors[1]
            });
            //set last color to clicked color
            this.pickedColors[this.pickindex].lastColor = this.threeColors[1];

            this.pickindex += 1;
            if(this.pickindex >= this.pickedColors.length){
                this.pickindex = 0;
            }
            this.setSquare(this.adeg);
            return false;
        },
        /**
         * Sets current square
         * @param {Number} deg The degree of current color
         */
        this.setSquare = function(deg){
            var c;
            this.hue = deg;
            this.adeg = deg;
            c = this.rgb2hex(this.hsv2rgb(this.hue,1,1));
            this.squarecolor = c[3];
            $("#wheel").css({
                backgroundColor: this.squarecolor
            });
        },
        /**
         * Keypress handler
         * @param {Event} e The event object
         */
        this.rotate = function(e){
            var key = e.which;
            this.handleKP(key);
        },
        /**
         * Respondes to key press event
         * @param {Number} key The key code
         */
        this.handleKP = function(key){
            switch (key) {
                case 13:
                    this.reHue(this.hue);
                    this.pickColor();
                    break; // enter key
                case 112:
                    this.reHue(this.hue);
                    this.pickColor();
                    break; // p to pick
                case 114:
                    this.reHue(0);
                    break; //r for red
                case 121:
                    this.reHue(60);
                    break; //y for yellow
                case 103:
                    this.reHue(120);
                    break; //g for green
                case 99:
                    this.reHue(180);
                    break; //c for cyan
                case 98:
                    this.reHue(240);
                    break; //b for blue
                case 109:
                    this.reHue(300);
                    break; //m for magenta
                case 106:
                    this.reHue(this.hue+1);
                    break; //j increases
                case 104:
                    this.reHue(this.hue+1);
                    break; //h increases (dvorak)
                case 107:
                    this.reHue(this.hue+355);
                    break; //k decreases more
                case 116:
                    this.reHue(this.hue+355);
                    break; //t decreases more (dvorak)
                case 108:
                    this.reHue(this.hue+359);
                    break; //l decreases
                case 110:
                    this.reHue(this.hue+359);
                    break; //n decreases (dvorak)
                // need second set for capital letters
                case 80:
                    this.reHue(this.hue);
                    this.pickColor();
                    break; // P 
                case 82:
                    this.reHue(0);
                    break; //R 
                case 89:
                    this.reHue(60);
                    break; //Y 
                case 71:
                    this.reHue(120);
                    break; //G
                case 67:
                    this.reHue(180);
                    break; //C
                case 66:
                    this.reHue(240);
                    break; //B
                case 77:
                    this.reHue(300);
                    break; //M
                case 74:
                    this.reHue(this.hue+1);
                    break; //J
                case 72:
                    this.reHue(this.hue+1);
                    break; //H
                case 75:
                    this.reHue(this.hue+355);
                    break; //K
                case 84:
                    this.reHue(this.hue+355);
                    break; //T
                case 76:
                    this.reHue(this.hue+359);
                    break; //L
                case 78:
                    this.reHue(this.hue+359);
                    break; //N
            }
            return false;
        },
        /**
         * Adjustes the hue value
         * @param {Number} deg New degree for hue
         */
        this.reHue = function(deg){
            var rgb, c;
            deg = deg % 360;
            this.setSquare(deg);
            rgb = this.hsv2rgb(deg, this.saturation, this.value);
            c = this.rgb2hex(rgb);
            this.hexColorArray(c);
            this.hoverColor();
            return false;
        }
        /**
         * Adjustes varois values for height or width concering changable width by multiplying
         * @param {Number} number The number to process
         * @return {Number} Returns the processed integer value 
         */
        this._multiply = function(number){
            return parseInt(Math.floor(number*this.multiplier));
        }
        /**
         * Adjustes varois values for height or width concering changable width by dividing
         * @param {Number} number The number to process
         * @return {Number} Returns the processed integer value 
         */
        this._divide = function(number){
            return parseInt(Math.floor(number/this.multiplier));
        }
    }
})(jQuery);