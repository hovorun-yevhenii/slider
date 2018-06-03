function Slider(opts) {
    Object.assign(this, opts);
    this.init();
}

Object.assign(Slider.prototype, {
    //Options
	sliderSelector: ".slider",
	loop: true,
	animationDuration: 500,
	arrows: true,
    preview: false,
    pagination: true,
    caption: false,
    autoPlay: false,
    autoPlayInterval: 500,
    swipeThreshold: 35,
    direction: "horizontal",
    onSlideChanged: null,

    //Properties
    index: 0,
    isMoving: false,
    autoPlayerCounter: null, 
    
	init() {
        this.sliderElement = $(this.sliderSelector)[0];    
        this.viewport = $(this.sliderElement).find(".slider__viewport")[0];
        this.slides = $(this.viewport).children();
        this.swipeZone = new Hammer(this.viewport);
        this.$find = selector => $(`${this.sliderSelector} ${selector}`);
   
        this.setupSize();
        
        if (this.autoPlay) {
            this.loop = true;
            this.setAutoPlayer();
        }

		if (this.arrows) {
			this.renderArrows();
        }
        
        if (this.preview) {
            this.renderPreview();
        } else if (this.pagination) {
            this.renderPagination();
        }

        if (this.caption) {
            this.renderCaption();
        }

        this.addListeners();
        this.updateControls(this.index);
    },

    updateControls(index) {
        if (!this.loop) {
            const hasPrev = index === 0,
                  hasNext = index === this.slides.length - 1;

            this.$find(`.arrow-prev`).css("display", hasPrev ? "none" : "block");
            this.$find(`.arrow-next`).css("display", hasNext ? "none" : "block");
        }

        if (this.preview) {
            const step = this.$find(`.preview-img`)[0].width,
                  previewPos = step * (index - 1.5);
            
            this.$find(`.preview-panel`).scrollTo(previewPos, this.animationDuration);
            this.$find(`.preview-img`).removeClass("preview-img_active");
            this.$find(`[data-index=${index}]`).addClass("preview-img_active");
        }
        
        if (this.pagination) {
            this.$find(`.pagination-btn`).removeClass("pagination-btn_active");
            this.$find(`[data-index=${index}]`).addClass("pagination-btn_active");
        }
    },

    setAutoPlayer() {
        this.autoPlayerCounter = setInterval( 
            () => this.moveNext(), 
            this.autoPlayInterval
        );
    },

    renderCaption() {
        _.each(this.slides, (slide, counter) => {
            $('<p/>', { 
                class: "slider__caption",
                style: `--content: "${counter + 1}. ${$(slide).children("img")[0].alt}"`
            }).appendTo(slide);
        });
    },

    setupSize() {
        this.baseSize = this.sliderElement.offsetWidth;

        $(this.viewport)
            .css("width", `${this.baseSize * this.slides.length}px`)
            .css("transition", `transform ${this.animationDuration / 1000}s`)
            .css("transform", `translateX(-${this.index * this.baseSize}px)`);
    },

    renderArrows() {
        $('<div/>', { class: "arrow-prev" }).appendTo(this.sliderElement);
        $('<div/>', { class: "arrow-next" }).appendTo(this.sliderElement);
    },

    renderPagination() {
        const paginationPanel = $('<div/>', { 
                class: "pagination-panel" 
            }).appendTo(this.sliderElement);

        _.each(this.slides, (slide, counter) => {
            $('<div/>', { 
                class: "pagination-btn",
                "data-index": counter
            }).appendTo(paginationPanel);
        });
    },

    addListeners() {
        $(window).resize(this.setupSize.bind(this))
                 .keydown(this.handleKeyDown.bind(this));

        this.swipeZone.on("pan", this.nandlePan.bind(this))
            .get("pan").set({ direction: Hammer[`DIRECTION_${this.direction.toUpperCase()}`] });

        if (this.arrows) {
            this.$find(`.arrow-prev`).click(this.movePrev.bind(this));
            this.$find(`.arrow-next`).click(this.moveNext.bind(this)); 
        }

        if (this.pagination) {
            this.$find(`.pagination-btn`).click(this.handlePaginationClick.bind(this));
        }

        if (this.preview) {
            this.$find(`.preview-img`).click(this.handlePaginationClick.bind(this));
        }
    },

    nandlePan(pan) {
        const axis = this.direction === "horizontal" ? "deltaX" : "deltaY",
              delta = pan[axis] * -1,
              whereWeStart = this.index * this.baseSize,
              timeToChange = Math.abs(delta) > this.baseSize / 5;

        if (timeToChange) {
            const direction = delta > 0 ? "Next" : "Prev";
            this[`move${direction}`]();
        //  delta > 0 ? this.moveNext() : this.movePrev();
        } else if (pan.isFinal) {
            $(this.viewport)
                .css("transition", `transform ${this.animationDuration / 1000}s`)
                .css("transform", `translateX(-${whereWeStart}px)`);
        } else {
            $(this.viewport)
                .css("transition", "none")
                .css("transform", `translateX(-${whereWeStart + delta}px)`);
        }
    },

    handleKeyDown(key) {
        if (key.keyCode === 37) {
            this.movePrev();
        } else if (key.keyCode === 39) {
            this.moveNext();
        }
    },

    movePrev(e) {
        if (this.isMoving || !this.loop && !this.index) return;

        const index = this.index === 0 ? this.slides.length - 1 : this.index - 1;

        this.moveToSlide(index);
    },

    moveNext(e) {
        if (this.isMoving || !this.loop && this.index === this.slides.length - 1) return;

        const index = this.index === this.slides.length - 1 ? 0 : this.index + 1;

        this.moveToSlide(index);
    },

    handlePaginationClick(click) {
        if (this.isMoving) return;

        const index = +$(click.target).attr("data-index");
        this.moveToSlide(index);
    },

    renderPreview() {
        const previewPanel = $('<div/>', { 
            class: "preview-panel" 
        }).appendTo(this.sliderElement);

        const previewBox = $('<div/>', {
            class: "preview-viewbox" 
        }).appendTo(previewPanel);

        _.each(this.slides, (slide, counter) => {
            $('<img/>', { 
                class: "preview-img",
                src: $(slide).children("img")[0].src,
                "data-index": counter
            }).appendTo(previewBox);
        });
    },

    moveToSlide(index) {
        if (this.index === index) return;

        this.index = index;
        this.isMoving = true;
        
        $(this.viewport)
            .css("transition", `transform ${this.animationDuration / 1000}s`)
            .css("transform", `translateX(-${index * this.baseSize}px)`);

        this.updateControls(index);
        
        setTimeout(() => {
            if (this.onSlideChanged) this.onSlideChanged();
            this.isMoving = false;
        },  this.animationDuration);
    }
});


const slider = new Slider({
    sliderSelector: "#slider",
    loop: false,
    arrows: true,
    pagination: true,
    preview: 1,
    caption: true,
    autoPlay: false,
    autoPlayInterval: 500,
    direction: "horizontal"
});

// const slider1 = new Slider({
//     sliderSelector: "#slider1",
//     loop: false,
//     arrows: true,
//     pagination: true,
//     preview: false,
//     caption: true,
//     autoPlay: false,
//     autoPlayInterval: 500,
//     onSlideChanged: userFunc
// });

function userFunc() {
    console.log([
        `HI! I'm User's callback. It's`,
        ` ${new Date().getHours()}`,
        `:${new Date().getMinutes()}`,
        `:${new Date().getSeconds()} o'clock`
    ].join(""));
}