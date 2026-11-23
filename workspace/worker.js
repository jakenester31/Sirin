import { Node, List } from "./classes.js";
import { canvas, context } from "./shared.js";

new List(
    [
        [20,50],[50,50],[50,130],[20,130]
    ], [
        {
            points: [0,1,2,3,0],
            dash: [10,5,1,1],
            dashOffset: e => ((e ?? 0) + 0.5) % 17,
            fill: "red",
            stroke: "blue",
        },
    ]
)


console.log(Node.instances)

addEventListener("message", ({data}) => {
    switch(data.type) {
        case "resize":
            const sf = data.width / canvas.width;
            transform.scale *= sf;
            transform.x *= sf;
            transform.y = data.height / 2 - (canvas.height / 2 - transform.y) * sf;
            canvas.width = data.width;
            canvas.height = data.height;
            transform.apply();
        break; case "move":
            transform.x += data.x;
            transform.y += data.y;
            transform.apply();
        break; case "scale":
            // const old = transform.scale;
            transform.scale *= data.factor
            transform.x = data.x - (data.x - transform.x) * data.factor;
            transform.y = data.y - (data.y - transform.y) * data.factor;
            // transform.scale += transform.scale * data.factor / 5;
            // transform.x -= (data.x - transform.x) * (transform.scale - old) / old;
            // transform.y -= (data.y - transform.y) * (transform.scale - old) / old;
            transform.apply();
        break; default:
            console.warn(`Worker has no matching handle for message of type "${data.type}"`);
    }
})

const transform = {
    scale: 1,
    x:0,
    y:0,
    apply() {
        context.resetTransform();
        context.translate(this.x,this.y);
        context.scale(this.scale,this.scale);
    }
};
transform.apply();

function loop() {
    // context.fillStyle = "black";
    context.fillRect(10,10,100,100);
    // context.beginPath();
    //     context.arc(-10,-10,5,0,2 * Math.PI);
    //     context.stroke();
    //     // context.fill();
    // context.closePath();
    // context.beginPath();
    //     context.arc(-50,-100,5,0,2 * Math.PI);
    //     context.fill();
    // context.closePath();
    // context.beginPath();
    //     context.arc(50,-70,5,0,2 * Math.PI);
    //     context.fill();
    // context.closePath();
    // context.beginPath();
    //     context.moveTo(-10,-10);
    //     context.lineTo(-50,-100);
    //     context.lineTo(50,-70);
    //     context.lineTo(-10,-10);
    //     // context.stroke();
    //     context.fill();
    // context.closePath();

    for (let i of Node.instances) {
        if (i.render) {
            i.render();
        }
    }


    const bitmap = canvas.transferToImageBitmap();
    postMessage({ type: "draw", bitmap }, [bitmap]);
    requestAnimationFrame(loop);
} loop();