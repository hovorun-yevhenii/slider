
class adaptiveCarousel {
    constructor(options) {
        this.sliderSelector = document.querySelector(options.sliderSelector); // $()
        this.swipeZone = new Hammer(this.sliderSelector);
        this.wrapper = this.sliderSelector.firstElementChild;
        this.viewport = this.wrapper.firstElementChild;
        this.slides = this.viewport.children;
        this.moving = false;
        this.index = 0;

        //Object.assign(this, options);
        this.arrows = options.arrows;
        this.pagination = options.pagination;
        this.preview = options.preview;
        this.previewLimit = options.previewLimie;
        this.swipeThreshold = options.swipeThreshold;
        this.animationDuration = options.animationDuration;

        this.initSlider();
    }

// INIT SLIDER
    initSlider() {
        this.setupWidth();

        if (this.arrows) {
            this.renderArrows();
        }
        
        if (this.pagination) {
            this.renderPagination();
            this.highLightPagination();
        }

        this.addListeners();
    }
// INDEX WATCHER
    get index() {
        return this._index;
    }

    set index(val) {
        if (this.moving) return;
        this._index = val;
        this.moveSlide(val);
    }
  
// LISTENERS
    addListeners() {
        $(window).resize(this.setupWidth.bind(this));
        this.swipeZone.on("panleft", this.moveNext.bind(this));
        this.swipeZone.on("panright", this.movePrev.bind(this));
        this.swipeZone.get("pan").set({ threshold: this.swipeThreshold });

        if (this.arrows) {
            $(".slider__arrow-prev").click(this.movePrev.bind(this));
            $(".slider__arrow-next").click(this.moveNext.bind(this));
        }

        if (this.pagination) {
            $(".slider__pagination-btn").click(this.handlePaginationClick.bind(this))
        }
    }

    setupWidth() {
        this.baseWidth = this.sliderSelector.offsetWidth;
        $(this.viewport).css("width", `${this.baseWidth * this.slides.length}px`);
        $(this.viewport).css("transform", `translateX(-${this.index * this.baseWidth}px)`);
    }

// ARROWS
    renderArrows() {
        const sliderSelector = this.sliderSelector;
        $('<div/>', { class: "slider__arrow-prev" }).appendTo(sliderSelector);
        $('<div/>', { class: "slider__arrow-next" }).appendTo(sliderSelector);
    }

    movePrev() {
        this.index = this.index === 0 ? this.slides.length - 1 : this.index - 1;
    }

    moveNext() {
        this.index = this.index === this.slides.length - 1 ? 0 : this.index + 1;
    }

// PAGINATION
    renderPagination() {
        const paginationPanel = $('<div/>', { 
            class: "slider__pagination-panel" 
        }).appendTo(this.sliderSelector);

        _.each(this.slides, (slide, i) => {
            $('<div/>', { 
                class: "slider__pagination-btn",
                "data-index": i
            }).appendTo(paginationPanel);
        });
    }

    handlePaginationClick(click) {
        this.index = +$(click.target).attr("data-index");
    }

    highLightPagination() {
        $(".slider__pagination-btn").removeClass("pagination-btn_active");
        $(`[data-index=${this.index}]`).addClass("pagination-btn_active");
    }

// MOVING
    moveSlide(index) {
        this.moving = true;
        
        $(this.viewport).css("transform", `translateX(-${this.index * this.baseWidth}px)`);
        setTimeout(() => this.moving = false, this.animationDuration);

        if (this.pagination) {
            this.highLightPagination();
        }
    }
}


new adaptiveCarousel({
    sliderSelector: ".slider",
    loop: false,
    animationDuration: 500,
    arrows: true,
    pagination: true,
    preview: false,
    previewLimit: false,
    swipeThreshold: 35
});