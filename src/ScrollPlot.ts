
class ScrollPlot extends HTMLElement {

    #resizeObserver: ResizeObserver

    #cnvs: HTMLCanvasElement | undefined
    #root: HTMLDivElement | undefined
    #placeholder: HTMLDivElement | undefined

    #canvasWidth = 320
    #canvasHeight = 160
    #seconds = 60
    #sampleRate = 32
    #offset = 0
    #width = 0

    #samples: number[] = []

    constructor() {
        super()
        this.#resizeObserver = new ResizeObserver(e => {
            this.#canvasWidth = e[0].contentRect.width
            if (this.#cnvs) {
                this.#cnvs.width = this.#canvasWidth
            }
            this.recalcWidth()
            this.redraw()
        })
    }

    get totalSeconds() {
        return this.#samples.length / this.#sampleRate
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'closed' })
        const template = document.getElementById('scrollPlot') as HTMLTemplateElement;
        const content = template.content.cloneNode(true)
        shadow.append(content)

        this.#root = shadow.getElementById('root') as HTMLDivElement
        this.#placeholder = shadow.getElementById('placeholder') as HTMLDivElement
        this.#cnvs = shadow.getElementById('cnvs') as HTMLCanvasElement

        this.#cnvs.height = this.#canvasHeight

        this.#root.addEventListener('scroll', (ev) => {
            this.#offset = this.#root!.scrollLeft
            if (this.#cnvs) {
                this.#cnvs.style.left = `${this.#offset}px`
            }
            this.redraw()
        })

        this.#resizeObserver.observe(this.#root)
    }

    recalcWidth() {
        this.#width = this.#canvasWidth * this.totalSeconds / this.#seconds
        if (this.#placeholder) {
            this.#placeholder.style.width = `${this.#width}px`
        }
    }

    redraw() {
        if (this.#cnvs) {
            const margin = 4
            const ctx = this.#cnvs.getContext('2d')!
            ctx.clearRect(0, 0, this.#cnvs.width, this.#cnvs.height)
            const firstSecond = Math.round(this.#offset / this.#width * this.totalSeconds)
            // console.log(firstSecond, this.totalSeconds)
            const s = Math.min(this.#seconds, this.totalSeconds - firstSecond)
            console.log(firstSecond)
            const pos = firstSecond * this.#sampleRate
            const n = s * this.#sampleRate
            const m = this.#seconds * this.#sampleRate
            let min = this.#samples[pos]
            let max = this.#samples[pos]
            for (let i = 1; i < n; ++i) {
                const v = this.#samples[i + pos]
                if (v < min) min = v
                if (v > max) max = v
            }
            const range = max - min
            ctx.beginPath()
            for (let i = 0; i < n; ++i) {
                const v = this.#samples[i + pos]
                const x = i / m * this.#canvasWidth
                const y = this.#canvasHeight - margin - (this.#canvasHeight - 2 * margin) * (v - min) / range
                if (i == 0) {
                    ctx.moveTo(x, y)
                } else {
                    ctx.lineTo(x, y)
                }
            }
            ctx.stroke()
        }
    }

    attributeChangedCallback(property: string, oldValue: string, newValue: string) {
        switch (property) {
            case 'height':
                this.#canvasHeight = parseInt(newValue)
                break
            case 'seconds':
                this.#seconds = parseInt(newValue)
                break
            case 'sample-rate':
                this.#sampleRate = parseInt(newValue)
                break
            default:
                console.error(`Unknown property: ${property}`)
        }
    }

    static get observedAttributes() {
        return ['height', 'seconds', 'sample-rate']
    }

    push(samples: number[]) {
        samples.forEach(s => this.#samples.push(s))
        this.recalcWidth()
        this.redraw()
    }
}

customElements.define('scroll-plot', ScrollPlot)
