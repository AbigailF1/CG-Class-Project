    const fileBtn = document.querySelector("#input-field");
    const uploadBtn = document.querySelector("#upload");
    const saveBtn = document.querySelector("#save-now");
    const undoBtn = document.querySelector("#undo-btn");
    const redoBtn = document.querySelector("#redo-btn");
    var canvas = document.querySelector("#img-box");
    var isDark = false;
    const cropButtonDOM = document.getElementById("crop-button");
    var beforeExpImagedata;
    var isExpRangeVisible = false;
    var ctx = canvas.getContext("2d");
    const changeControl = {
        prevImage: null,
        currentImage: null,
        nextImage: null,
    };

    let initialState;
    function captureInitialState() {
        initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    window.onload = function() {
        captureInitialState(); // Capture the initial empty canvas state when the page loads
    };


    // Function to clear the canvas (reset to the original state)
    function clearCanvas() {
        saveState();
        // Restore the canvas to the initial state
        ctx.putImageData(initialState, 0, 0);

        // Optionally reset file input in case you want to allow the user to upload again
        document.getElementById('input-field').value = ""; // Reset file input to allow re-upload
        history.undoStack = [baseImageData];
        history.redoStack = [];
        updateButtonState(); // Update button states as needed
    }

  
    // Function to handle image loading
    let baseImageData = null; // To store the base image

    function loadImage(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.onload = function () {
                    canvas.width = img.width;
                    canvas.height = img.height;
    
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
                    // Save base image state
                    baseImageData = {
                        imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
                        width: canvas.width,
                        height: canvas.height,
                    };
    
                    // Reset stacks
                    history.undoStack = [baseImageData]; // Start with base image
                    history.redoStack = [];
                    updateButtonState();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    // Function to capture the initial state of the canvas

    var flag=true;
    const themeSwitch = document.querySelector('input');

    const fileInput = document.querySelector("#input-field");
    const widthInput = document.querySelector("#input_width");
    const heightInput = document.querySelector("#input_height");
    const aspectToggle = document.querySelector("#check_aspect-ratio");
    const canvasCtx = canvas.getContext("2d");
    themeSwitch.addEventListener('change', () => {
        if (!isDark) {
            document.getElementById("dark").style.display = "none"
            document.getElementById("light").style.display = "block"
        }
        else {
            document.getElementById("dark").style.display = "block"
            document.getElementById("light").style.display = "none"
        }
        isDark = !isDark;
    document.body.classList.toggle('dark-theme');
    });
    // Initialize stacks for undo and redo
    const history = {
        undoStack: [],
        redoStack: [],
    };
    
    
    // Save the current state of the canvas to the undo stack
    const saveState = () => {
        const currentState = {
            imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
            width: canvas.width,
            height: canvas.height,
        };
    
        // If the undo stack is empty, save the base image first
        if (history.undoStack.length === 0 && baseImageData) {
            history.undoStack.push(baseImageData);
        }
    
        // Push the current state to the undo stack
        history.undoStack.push(currentState);
        history.redoStack = []; // Clear redo stack whenever a new state is saved
        updateButtonState();
    };
    
    // Update the state of undo/redo buttons
    const updateButtonState = () => {
        undoBtn.classList.toggle("disabled", history.undoStack.length <= 1); // Keep base image in stack
        redoBtn.classList.toggle("disabled", history.redoStack.length === 0);
    };
    
    // Undo the last action
    const unDo = () => {
        if (history.undoStack.length > 1) { // Always keep the base state in the stack
            const currentState = {
                imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
                width: canvas.width,
                height: canvas.height,
            };
            history.redoStack.push(currentState); // Save current state to redo stack
    
            const previousState = history.undoStack.pop(); // Get the previous state
            canvas.width = previousState.width;
            canvas.height = previousState.height;
            ctx.putImageData(previousState.imageData, 0, 0); // Restore the previous state
        } else if (baseImageData) {
            // If only the base state is left, restore it
            canvas.width = baseImageData.width;
            canvas.height = baseImageData.height;
            ctx.putImageData(baseImageData.imageData, 0, 0);
        }
        updateButtonState();
    };
    
    // Redo the last undone action
    const reDo = () => {
        if (history.redoStack.length > 0) {
            const currentState = {
                imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
                width: canvas.width,
                height: canvas.height,
            };
            history.undoStack.push(currentState); // Save current state to undo stack
    
            const nextState = history.redoStack.pop(); // Get the next state
            canvas.width = nextState.width;
            canvas.height = nextState.height;
            ctx.putImageData(nextState.imageData, 0, 0); // Restore the next state
        }
        updateButtonState();
    };
    



    // Attach event listeners
    undoBtn.addEventListener("click", unDo);
redoBtn.addEventListener("click", reDo);
fileBtn.addEventListener("change", loadImage);

    saveBtn.addEventListener("click", () => saveState()); // Save the state manually when needed
    uploadBtn.addEventListener("click", () => {
        clearCanvas();
        // other file upload logic
    });



    // Rotate image on cick 
    const Root = document.documentElement
    const gRoot = getComputedStyle(Root)

    var RotateDeg = parseInt(gRoot.getPropertyValue('--turn'))

    function rotate() {
        saveState();
        ctx.save();
    // prep canvas for rotation
        ctx.translate(canvas.width, 0);                   // translate to canvas center
        ctx.rotate(Math.PI*0.5);                 // add rotation transform
        ctx.globalCompositeOperation = "copy";   // set comp. mode to "copy"
        ctx.drawImage(ctx.canvas,  0, 0, canvas.height, canvas.width); // draw image
        ctx.restore();
        //Root.style.setProperty('--turn', RotateDeg + "deg")
    }



    // Draw a rectangle to indicate the cropping area during mousemove
    const doCrop = (initialCoords, imageData, event) => {
        ctx.putImageData(imageData, 0, 0);
        const rect = canvas.getBoundingClientRect();
        const coords = {
            x: ((event.clientX - rect.left) / (rect.right - rect.left)) * canvas.width,
            y: ((event.clientY - rect.top) / (rect.bottom - rect.top)) * canvas.height,
        };
        const width = coords.x - initialCoords.x;
        const height = coords.y - initialCoords.y;
    
        // Draw a transparent rectangle to show the cropping area
        ctx.beginPath();
        ctx.rect(initialCoords.x, initialCoords.y, width, height);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "red"; // Highlight the cropping area
        ctx.stroke();
    };
    
    // Crop and set the new image on mouseup
    const endCrop = (initialCoords, event) => {
        document.body.style.cursor = "default"; // Reset cursor
        canvas.removeEventListener("mousemove", doCrop); // Remove event listener
        canvas.removeEventListener("mouseup", endCrop);

        const rect = canvas.getBoundingClientRect();
        const finalCoords = {
            x: ((event.clientX - rect.left) / (rect.right - rect.left)) * canvas.width,
            y: ((event.clientY - rect.top) / (rect.bottom - rect.top)) * canvas.height,
        };

        // Calculate the cropped area's dimensions
        const startX = Math.min(initialCoords.x, finalCoords.x);
        const startY = Math.min(initialCoords.y, finalCoords.y);
        const width = Math.abs(finalCoords.x - initialCoords.x);
        const height = Math.abs(finalCoords.y - initialCoords.y);

        // Get cropped image data
        const croppedImage = ctx.getImageData(startX, startY, width, height);

        // Update canvas dimensions to match cropped area
        canvas.width = width;
        canvas.height = height;

        // Redraw the cropped image onto the canvas
        ctx.putImageData(croppedImage, 0, 0);

        // Update activeImage to reflect the cropped area
        activeImage = new Image();
        activeImage.src = canvas.toDataURL();
    };

    // Initialize cropping on mousedown
    const startCrop = (imageData, event) => {
        document.body.style.cursor = "crosshair"; // Set cursor to crosshair
        const rect = canvas.getBoundingClientRect();
        const initialCoords = {
            x: ((event.clientX - rect.left) / (rect.right - rect.left)) * canvas.width,
            y: ((event.clientY - rect.top) / (rect.bottom - rect.top)) * canvas.height,
        };

        const mouseMoveHandler = (e) => doCrop(initialCoords, imageData, e);
        const mouseUpHandler = (e) => endCrop(initialCoords, e);

        canvas.addEventListener("mousemove", mouseMoveHandler);
        canvas.addEventListener("mouseup", (e) => {
            endCrop(initialCoords, e);
            canvas.removeEventListener("mousemove", mouseMoveHandler); // Clean up event listeners
            canvas.removeEventListener("mouseup", mouseUpHandler);
        });
    };

    // Trigger crop functionality
    const cropImage = () => {
        saveState();
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        canvas.addEventListener("mousedown", (event) => startCrop(imageData, event));
    };

    // Resizer scripting.....by Sayan Kumar
    let activeImage, originalWidthToHeightRatio;

    fileInput.addEventListener("change", (e) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
        openImage(reader.result);
    });

    reader.readAsDataURL(e.target.files[0]);
    });

    widthInput.addEventListener("change", () => {
    if (!activeImage) return;

    const heightValue = aspectToggle.checked
        ? widthInput.value / originalWidthToHeightRatio
        : heightInput.value;

    resize(widthInput.value, heightValue);
    });

    heightInput.addEventListener("change", () => {
    if (!activeImage) return;

    const widthValue = aspectToggle.checked
        ? heightInput.value * originalWidthToHeightRatio
        : widthInput.value;

    resize(widthValue, heightInput.value);
    });

    function openImage(imageSrc) {
    activeImage = new Image();

    activeImage.addEventListener("load", () => {
        originalWidthToHeightRatio = activeImage.width / activeImage.height;

        resize(activeImage.width, activeImage.height);
    });

    activeImage.src = imageSrc;
    }

    function resize(width, height) {
        saveState();
    canvas.width = Math.floor(width);
    canvas.height = Math.floor(height);
    widthInput.value = Math.floor(width);
    heightInput.value = Math.floor(height);

    canvasCtx.drawImage(activeImage, 0, 0, Math.floor(width), Math.floor(height));
    canvasCtx.putImageData(activeImage, 0, 0, Math.floor(width), Math.floor(height));
    }
    //end of resizer scripting

    // Show Exposure Range
    const showExposureRange = () => {
    if (!isExpRangeVisible) {
        document.getElementById("exposure-icon").style.display = "none";
        document.getElementById("exposure-range").style.display = "block";
        beforeExpImagedata = ctx.getImageData(0, 0, canvas.width, canvas.height);
        isExpRangeVisible = true;
    }
    };

    // Change Exposure
    const changeExposure = (event) => {
        saveState();
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const val = event.target.value;
    for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = beforeExpImagedata.data[i] + 255 * (val / 100);
        imageData.data[i + 1] = beforeExpImagedata.data[i + 1] + 255 * (val / 100);
        imageData.data[i + 2] = beforeExpImagedata.data[i + 2] + 255 * (val / 100);
    }
    ctx.putImageData(imageData, 0, 0);
    };


    // Remove image btn click
    function remove()
    {
        flag=true;
    document.getElementById("img-box").style.display='none';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.querySelector("div.uploaded-img-container").style.display = "block";
    flag=true;

    }

    //Function to call specific filters and do change control, add new cases for new filters
    function applyFilter(filter) {
        saveState();
        redoBtn.classList.add("disabled");
        undoBtn.classList.remove("disabled");
        changeControl.nextImage = null;
        changeControl.prevImage = changeControl.currentImage;
        switch (filter) {
            case "grey":
                doGreyScale();
                break;
            case "sepia":
                doSepia();
                break;
            case "lark":
                doLark();
                break;
            case "amaro":
                doAmaro();
                break;
            case "flip":
                doFlip();
                break;
            case "sunset":
                doSunset();
                break;
            case "rainbow":
                doRainbow();
                break;
            case "prison":
                doPrison();
                break;
            case "crumble":
                doCrumble();
                break;
            case "remove":
                remove();
        }
        // Save the current state after applying the filter
        changeControl.currentImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
    }


    //global variable 
    var uploaded_img = "";

    //Action button for file upload
    function uploadbtnActive(){
        flag=true;
        fileBtn.click();
    
    }


    //Simple algorithm to convert image to GreyScale
    function doGreyScale(){
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imageData.data;
        for(var i = 0; i < data.length; i += 4){
            var avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg;
            data[i + 1] = avg;
            data[i + 2] = avg;
        }
        ctx.putImageData(imageData, 0, 0);
    }

    //Simple algorithm to convert image to Sepia
    function doSepia(){
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imageData.data;
        for(let i = 0; i < data.length; i += 4){
            data[i]*=1.07;
            data[i + 1]*=0.74;
            data[i + 2]*=0.43;
        }
        ctx.putImageData(imageData, 0, 0);
    }

    //Simple algorithm to convert image to Lark
    function doLark(){
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imageData.data;
        brightness(data,0.08);
        rgbAdjust(data,[1,1.03,1.05]);
        saturation(data,0.12);
        ctx.putImageData(imageData, 0, 0);
    }

    //Simple algorithm to convert image to Amaro
    function doAmaro(){
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imageData.data;
        brightness(data,0.15);
        saturation(data,0.3);
        ctx.putImageData(imageData, 0, 0);
    }

    //simple algorithm to flip image
    function doFlip(){
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imageData.data;
        for(let i = 0; i < data.length; i += 4){
            var d1=data[i];
            var d2= data[i+1];
            var d3=data[i+2];
            data[i]=d2;
            data[i + 1]=d3;
            data[i + 2]=d1;
        }
        ctx.putImageData(imageData, 0, 0);
    }

    //sunset filter
    function doSunset(){
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imageData.data;
        for(let i=0;i<data.length;i+=4){
            data[i]=255;
        }
        ctx.putImageData(imageData, 0, 0);

    }

    //Rainbow filter
    function doRainbow(){
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imageData.data;
    for(let i=0;i<data.length;i+=4){
        var avg= (data[i]+data[i+1]+data[i+2])/3;
        if(i>=0 && i<data.length/7){
            if(avg<128){
                data[i]=2*avg;
                data[i+1]=0;
                data[i+2]=0;
            }
            else if(avg>=128){
                data[i]=255;
                data[i+1]=(2*avg)-255;
                data[i+2]=(2*avg)-255;
            }
        }

        if(i>=data.length/7 && i<(data.length*2)/7){
            if(avg<128){
                data[i]=2*avg;
                data[i+1]=0.8*avg;
                data[i+2]=0;
            }
            else if(avg>=128){
                data[i]=255;
                data[i+1]=(1.2*avg)-51;
                data[i+2]=(2*avg)-255;
            }
        }

        if( i>=(data.length*2)/7 && i<data.length*3/7){
            if(avg<128){
                data[i]=2*avg;
                data[i+1]=2*avg;
                data[i+2]=0;
            }
            else if(avg>=128){
                data[i]=255;
                data[i+1]=255;
                data[i+2]=(2*avg)-255;
            }
        }

        if( i>=data.length*3/7 && i<data.length*4/7){
            if(avg<128){
                data[i]=0;
                data[i+1]=2*avg;
                data[i+2]=0;
            }
            else if(avg>=128){
                data[i]=(2*avg)-255;
                data[i+1]=255;
                data[i+2]=(2*avg)-255;
            }
        }

        if( i>=data.length*4/7 && i<data.length*5/7){
            if(avg<128){
                data[i]=0;
                data[i+1]=0;
                data[i+2]=2*avg;
            }
            else if(avg>=128){
                data[i]=(2*avg)-255;
                data[i+1]=(2*avg)-255;
                data[i+2]=255;
            }
        }

        if( i>=data.length*5/7 && i<data.length*6/7){
            if(avg<128){
                data[i]=0.8*avg;
                data[i+1]=0;
                data[i+2]=2*avg;
            }
            else if(avg>=128){
                data[i]=(1.2*avg)-51;
                data[i+1]=(2*avg)-255;
                data[i+2]=255;
            }
        }

        if( i>=data.length*6/7 ){
            if(avg<128){
                data[i]=1.6*avg;
                data[i+1]=0;
                data[i+2]=1.6*avg;
            }
            else if(avg>=128){
                data[i]=(0.4*avg)+153;
                data[i+1]=(2*avg)-255;
                data[i+2]=(0.4*avg)+153;
            }
        }

            

    }
        ctx.putImageData(imageData, 0, 0);

    }


    //prison filter
    function doPrison(){
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imageData.data;
        for(let i=0;i<data.length;i+=4){
            if(i>=0 && i<1195){
                data[i]=0;
                data[i+1]=0;
                data[i+2]=0;
            }
            if(i>=data.length/6 && i<(data.length/6)+10+1195){
                data[i]=0;
                data[i+1]=0;
                data[i+2]=0;
            }
            if(i>=data.length*2/6 && i<(data.length*2/6)+10+1195){
                data[i]=0;
                data[i+1]=0;
                data[i+2]=0;
            }
            if(i>=data.length*3/6 && i<(data.length*3/6)+10+1195){
                data[i]=0;
                data[i+1]=0;
                data[i+2]=0;
            }
            if(i>=data.length*4/6 && i<(data.length*4/6)+10+1195){
                data[i]=0;
                data[i+1]=0;
                data[i+2]=0;
            }
            if(i>=data.length*5/6 && i<(data.length*5/6)+10+1195){
                data[i]=0;
                data[i+1]=0;
                data[i+2]=0;
            }
        
        }

        ctx.putImageData(imageData, 0, 0);
    }


    //crumble filter
    function doCrumble(){
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imageData.data;
        for(let i=0;i<data.length;i+=4){
            var ran=Math.random();
            if(ran>0.5){
                var p=i+1;
                data[p]=data[i];
                data[p+1]=data[i+1];
                data[p+2]=data[i+2];

            }
        }
        ctx.putImageData(imageData, 0, 0);
    }

    //val should be from -1 to 1 and 0 for unchanged
    function brightness(data,val){
        if(val<=-1){
            val=-1;
        }
        if(val>=1){
            val=1;
        }
        val=~~(255*val);
        for(let i=0;i<data.length;i+=1){
            data[i]+=val;
        }
    }

    //val should be -1 to positive number and 0 is for unchanged
    function saturation(data,val){
        if(val<=-1){
            val=-1;
        }
        for(let i=0;i<data.length;i+=4){
            let gray=0.2989*data[i]+0.1140*data[i+2]+0.5870*data[i+1];
            data[i]= -gray*val+data[i]*(1+val);
            data[i+1]= -gray*val+data[i+1]*(1+val);
            data[i+2]= -gray*val+data[i+2]*(1+val);
        }
    }

    //RGB Adjust
    function rgbAdjust(data,vals){
        for(let i=0;i<data.length;i+=4){
            data[i]*=vals[0];
            data[i+1]*=vals[1];
            data[i+2]*=vals[2];
        }
    }

    // Adjust image exposure
    rangeInput = document.getElementById('range');

    container = document.getElementsByClassName('img-box')[0];

    rangeInput.addEventListener("mousemove",function(){
    container.style.filter = "brightness(" + rangeInput.value + "%)";
    });

    //Save Image from Canvas
    saveBtn.addEventListener("click", function(){
        if(flag) {alert("Please upload image");}
    else  {
            flag=true;
        const downloadImg = canvas.toDataURL("image/png");
        saveBtn.href = downloadImg;
        saveBtn.download = "image.png";
        flag=true;
        }
    
    });

    //Rendering user Generated Image onto Canvas
    fileBtn.addEventListener('change', function(){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        const reader = new FileReader();
        reader.addEventListener('load',() => {
            uploaded_img = reader.result;
            const image = new Image();
            image.src = uploaded_img;
        
            image.onload = () => {
                document.querySelector("div.uploaded-img-container").style.display = "none";
                canvas.style.display = "block";
                ctx.clearRect(0,0,canvas.width,canvas.height);
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                changeControl.currentImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
                flag=false;
            };
        });
        reader.readAsDataURL(this.files[0]);
    });

    cropButtonDOM.addEventListener("click", cropImage);


    let saturate = 100;
    let huerotate = 0;
    let blur = 0;
    let opacity = 100;

    const imgture = document.getElementById("img-box");

    const saturateSlider = document.getElementById("saturate-slider");
    const saturateValue = document.getElementById("saturate");

    const hueSlider = document.getElementById("hue-slider");
    const hueValue = document.getElementById("hue");

    const blurSlider = document.getElementById("blur-slider");
    const blurValue = document.getElementById("blur");

    const opacitySlider = document.getElementById("opacity-slider");
    const opacityValue = document.getElementById("opacity");

    function updateFilter() {
        saveState();    
        imgture.style.filter =
            "saturate(" +
            saturate +
            "%) hue-rotate(" +
            huerotate +
            "deg) blur(" +
            blur +
            "px) opacity(" +
            opacity +
            "%)";
    }

    saturateSlider.addEventListener("input", function() {
        saturateValue.innerHTML =  saturateSlider.value + "%";
        saturate =  saturateSlider.value;
        updateFilter();
    });

    hueSlider.addEventListener("input", function() {
        hueValue.innerHTML = hueSlider.value + "°";
        huerotate = hueSlider.value;
        updateFilter();
    });

    blurSlider.addEventListener("input", function() {
        blurValue.innerHTML = blurSlider.value + "px";
        blur = blurSlider.value;
        updateFilter();
    });

    opacitySlider.addEventListener("input", function() {
        opacityValue.innerHTML = 100 - opacitySlider.value + "%";
        opacity = 100 - opacitySlider.value;
        updateFilter();
    });


