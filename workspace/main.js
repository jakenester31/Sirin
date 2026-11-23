import sheet from "./main.css" with { type: "css" };

export class Workspace extends HTMLElement {
    canvas = document.createElement('canvas');
    context = this.canvas.getContext("2d");
    worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
    bitmap;
    
    constructor() {
        super();
        this.context.globalCompositeOperation = "copy";
        // Attach shadow, canvas, and css
        this.attachShadow({ mode: "open" });
        this.shadowRoot.append(this.canvas);
        this.shadowRoot.adoptedStyleSheets = [sheet];
        // Message listeners
        this.worker.addEventListener("message",({data:{type,...data}}) => this.received(type,data));
        this.worker.addEventListener("error", e => console.error(e),false);
        // Size listener
        new ResizeObserver(([entry]) => {
            this.canvas.width = Math.max(entry.devicePixelContentBoxSize[0].inlineSize,1);
            this.canvas.height = Math.max(entry.devicePixelContentBoxSize[0].blockSize,1);
            this.context.globalCompositeOperation = "copy";
            if (this.bitmap) this.context.drawImage(this.bitmap,0,0);
            this.post("resize",{ width: this.canvas.width, height: this.canvas.height });
        }).observe(this.canvas, { box: "device-pixel-content-box" });
        // Movement listeners
        this.canvas.addEventListener("mousedown",function (e) {
            addEventListener("mousemove",move);
            addEventListener("mouseup",up);
        }.bind(this));

        const move = function ({button,movementX:x,movementY:y}) {
            this.post("move",{x,y});
        }.bind(this);

        function up() {
            removeEventListener("mousemove",move);
            removeEventListener("mouseup",up);
        }
        // Zoom listener
        this.canvas.addEventListener("wheel",(e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.post("scale",{
                factor: Math.exp(-e.deltaY * 0.001),
                x: (e.clientX - rect.left) * devicePixelRatio,
                y: (e.clientY - rect.top) * devicePixelRatio
            })
        }, { passive: false })
    }

    static schema = {
        "resize": ["width","height"],
        "move": ["x","y"],
        "scale": ["factor","x","y"]
    }

    post(type,data = {}) {
        // Detect missing values
        if (Workspace.schema[type]) {
            const missing = Workspace.schema[type]?.filter(e => !Object.hasOwn(data,e));
            if (missing?.length)
                console.warn(`Sending Renderer message of type "${type}" with missing properties: ${missing.join(", ")}`)
        } else console.warn(`Sending unrecognized Renderer message of type "${type}"`);
        // Post message
        this.worker.postMessage({type,...data});
    }

    received(type,data) {
        switch(type) {
            case "draw":
                this.bitmap?.close();
                this.bitmap = data.bitmap;
                
                // this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.context.drawImage(this.bitmap,0,0);
            break; default:
                console.warn(`Renderer has no matching handle for message of type "${type}"`);
        }
    }
}

customElements.define("workspace-",Workspace);