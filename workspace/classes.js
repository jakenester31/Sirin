import { context } from "./shared.js";

export class Node {
    static instances = new Set;
    static #count = 0;
    static #registry = new Map;
    static #cleanup = new FinalizationRegistry(id => Node.#registry.delete(id));

    static get(id) { 
        const node = this.#registry.get(id)?.deref();
        return this.instances.has(node) ? node : undefined;
    }

    static remove(id) {
        this.instances.delete(this.get(id));
        this.#registry.delete(id);
    }

    #id = Node.#count++;
    get id() { return this.#id }

    constructor() {
        Node.instances.add(this);
        Node.#registry.set(this.id,new WeakRef(this));
        Node.#cleanup.register(this,this.id);
    }

    remove() { Node.remove(this.id); }
}

export class List extends Node {
    connections = [];
    constructor(points,connections) {
        super();
        this.points = new Float64Array(points.flat());
        for (let i of connections) {
            this.connections.push(Object.assign({
                // defaults
                points: [],
                dash: [],
                dashOffset: 0,
                edge: "miter", // linejoin: miter, bevel, round
                // path: "solid", // solid, dashed
                strokeWidth: 1,
                // Can be set to a color, null, or "erase"
                stroke: "black",
                fill: null
            },i))
        }
    }

    add(points) {
        this.points = new Float64Array([...this.points,...points.flat()]);
    }

    render() {
        context.save();
        for (let group of this.connections) {
            context.beginPath();
            // Setup styles
            context.fillStyle = group.fill;
            context.strokeStyle = group.stroke;
            context.lineJoin = group.edge;
            context.lineWidth = group.strokeWidth;
            context.setLineDash(group.dash);
            context.lineDashOffset = r(group.dashOffset);
            const p = group.points;

            context.moveTo(this.points[p[0] * 2],this.points[p[0] * 2 + 1]);
            for (let i = 1; i < p.length - 1; i++) {
                context.lineTo(this.points[p[i] * 2],this.points[p[i] * 2 + 1]);
            }
            if (p.at(-1) == p[0])
                context.closePath();
            else context.lineTo(this.points[p.at(-1) * 2],this.points[p.at(-1) * 2 + 1]);

            if (group.fill == "erase") context.globalCompositeOperation = 'destination-out';
            if (group.fill) context.fill();
            if (group.fill == "erase") context.globalCompositeOperation = "source-over";

            if (group.stroke == "erase") context.globalCompositeOperation = 'destination-out';
            if (group.stroke) context.stroke();
            if (group.stroke == "erase") context.globalCompositeOperation = "source-over";
        }
        context.restore();
    }
}

function random(min = 0, max = 1, step = 1) {
    [min,max] = [Math.min(min,max), Math.max(min,max)];
    const steps = Math.floor((max - min) / step) + 1;
    const res = min + Math.floor(Math.random() * steps) * step;
    const place = (step.toString().split('.')[1] || '').length;
    return Number(res.toFixed(place));
}

function r(data) {
    if (typeof data == "function") {
        data.value = data(data.value);
        return data.value;
    }
    return data;
}