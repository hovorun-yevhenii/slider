function Slider(opts) {
    Object.assign(this, opts);
    this.init();
}

Object.assign(Slider.prototype, {
    //Options
    sliderSelector: '.slider',
    loop: true,
    animationDuration: 500,
    arrows: true,
    preview: false,
    pagination: true,
    autoPlay: false,
    autoPlayInterval: 500,
    direction: 'horizontal',
    onSlideChanged: null,
    animationType: 'default',

    //Properties
    index: 0,
    isMoving: false,
    autoPlayerCounter: null,

    cssProps: {
        size: 'width',
        flexDir: 'row',
        axis: 'X'
    },

    LEFT_ARROW_CODE: 37,
    UP_ARROW_CODE: 38,
    RIGHT_ARROW_CODE: 39,
    DOWN_ARROW_CODE: 40,
    
	init() {
        this.$el = $(this.sliderSelector);
        this.$viewport = this.$el.find('.slider__viewport');
        this.slides = this.$viewport.children();
        
        this.viewportSwipe = new Hammer(this.$viewport[0]);
        this.viewportTransition = `transform ${this.animationDuration / 1000}s`;

        //TODO Переписать под Jquery
        if (this.direction === 'vertical') {
            this.cssProps.size = 'height';
            this.flexDir = 'column';
            this.cssProps.axis = 'Y'       
        }
   
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

        this.addListeners();
        this.updateControls(this.index);
    },

    addListeners() {
        $(window).resize(this.setupSize.bind(this))
                 .keydown(this.keyDownHandler.bind(this));

        this.viewportSwipe.on('pan', this.viewportPanHandler.bind(this))
            .get('pan').set({ direction: Hammer[`DIRECTION_${this.direction.toUpperCase()}`] });

        if (this.arrows) {
            this.$el.find(`.arrow-prev`).click(this.movePrev.bind(this));
            this.$el.find(`.arrow-next`).click(this.moveNext.bind(this)); 
        }

        if (this.pagination) {
            this.$el.find(`.pagination-btn`).click(this.paginationClickHandler.bind(this));
        }

        if (this.preview) {
            this.$el.find(`.preview-img`).click(this.paginationClickHandler.bind(this));
            this.previewSwipe
                .on('pan', this.previewPanHandler.bind(this))
                .get('pan')
                .set({ direction: Hammer[`DIRECTION_${this.direction.toUpperCase()}`] });
        }
    },

    updateControls(index) {
        if (!this.loop) {
            const hasPrev = index === 0,
                  hasNext = index === this.slides.length - 1;

            this.$el.find(`.arrow-prev`).css('display', hasPrev ? 'none' : 'block');
            this.$el.find(`.arrow-next`).css('display', hasNext ? 'none' : 'block');
        }

        if (this.preview) {
            const step = this.$el.find(`.preview-img`)[0][this.cssProps.size],
                  scrollPos = step * (index - 1.5);

            this.previewPanel.scrollTo(scrollPos, this.animationDuration);

            this.$el.find(`.preview-img`).removeClass('preview-img_active');
            this.$el.find(`[data-index=${index}]`).addClass('preview-img_active');
        }
        
        if (this.pagination) {
            this.$el.find(`.pagination-btn`).removeClass('pagination-btn_active');
            this.$el.find(`[data-index=${index}]`).addClass('pagination-btn_active');
        }
    },

    setAutoPlayer() {
        this.autoPlayerCounter = setInterval( 
            () => this.moveNext(), 
            this.autoPlayInterval
        );
    },

    setupSize() {
        this.baseSize = this.$el[this.cssProps.size]();

        this.$viewport
            .css(this.cssProps.size, `${this.baseSize * this.slides.length}px`)
            .css('flex-direction', this.cssProps.flexDir)
            .css('transition', this.viewportTransition)
            .css('transform', `translate${this.cssProps.axis}(-${this.index * this.baseSize}px)`);
    },

    renderArrows() {
        $('<div/>', { class: 'arrow-prev' }).appendTo(this.$el);
        $('<div/>', { class: 'arrow-next' }).appendTo(this.$el);
    },

    renderPagination() {
        const paginationPanel = $('<div/>', { 
                class: 'pagination-panel' 
            }).appendTo(this.$el);

        _.each(this.slides, (slide, counter) => {
            $('<div/>', { 
                class: 'pagination-btn',
                'data-index': counter
            }).appendTo(paginationPanel);
        });
    },

    viewportPanHandler(pan) {
        if (this.isMoving) return;

        const delta = pan[`delta${this.cssProps.axis}`] * -1,
              startPoint = this.index * this.baseSize,
              shouldChange = pan.distance > this.baseSize / 5;

        if (shouldChange) {
            delta > 0 ? this.moveNext() : this.movePrev();
        } else if (pan.isFinal) {
            this.$viewport
                .css('transition', this.viewportTransition)
                .css('transform', `translate${this.cssProps.axis}(-${startPoint}px)`);
        } else {
            this.$viewport
                .css('transition', 'none')
                .css('transform', `translate${this.cssProps.axis}(-${startPoint + delta}px)`);
        }
    },

    previewPanHandler(pan) {
        const sign = Math.sign(pan[`delta${this.cssProps.axis}`]),
              scrollPos = this.previewPanel[0].scrollLeft;

        this.previewPanel.scrollTo(scrollPos - 10 * sign);
    },

    keyDownHandler(key) {
        if (key.keyCode === this.LEFT_ARROW_CODE
            || key.keyCode === this.UP_ARROW_CODE
        ) {
            this.movePrev();
        } else if (key.keyCode === this.RIGHT_ARROW_CODE
            || key.keyCode === this.DOWN_ARROW_CODE
        ) {
            this.moveNext();
        }
    },

    movePrev(e) {
        if (!this.loop && !this.index) return;

        const index = this.index === 0 ? this.slides.length - 1 : this.index - 1;

        this.moveToSlide(index);
    },

    moveNext(e) {
        if (!this.loop && this.index === this.slides.length - 1) return;

        const index = this.index === this.slides.length - 1 ? 0 : this.index + 1;

        this.moveToSlide(index);
    },

    paginationClickHandler(click) {
        const index = +$(click.target).attr('data-index');

        this.moveToSlide(index);
    },

    renderPreview() {
        this.previewPanel = $('<div/>', { 
            class: 'preview-panel' 
        }).appendTo(this.$el);

        const previewUnit = $('<div/>', {
            class: 'preview-viewbox' 
        }).appendTo(this.previewPanel);

        _.each(this.slides, (slide, counter) => {
            $('<img/>', { 
                class: 'preview-img',
                src: $(slide).children('img')[0].src,
                'data-index': counter
            }).appendTo(previewUnit);
        });

        this.previewSwipe = new Hammer(this.previewPanel[0]);
    },

    startAnimationHandler(type) {
        this.$el.find(`.slider__slide`)
            .css('transition', '.5s')
            .css('transform', 'skewY(180deg)');

        setTimeout(() => {
            this.$el.find(`.slider__slide`)
                .css('transition', 'none')
                .css('transform', 'skewY(0)');
        },  this.animationDuration);
    },

    moveToSlide(index) {
        if (this.index === index) return;

        this.index = index;
        this.isMoving = true;

        if (this.animationType !== 'default') {
            this.startAnimationHandler(this.animationType);
        }

        this.$viewport
            .css('transition', this.viewportTransition)
            .css('transform', `translate${this.cssProps.axis}(-${index * this.baseSize}px)`);

        this.updateControls(index);
        
        setTimeout(() => {
            if (this.onSlideChanged) this.onSlideChanged();
            
            this.isMoving = false;
        },  this.animationDuration);
    }
});


const slider = new Slider({
    sliderSelector: '#slider',
    loop: false,
    arrows: true,
    pagination: true,
    preview: true,
    autoPlay: false,
    autoPlayInterval: 500,
    animationType: 'default', // 'skewX'
    direction: 'horizontal',
    onSlideChanged: null
});

function userFunc() {
    console.log([
        `HI! I'm User's callback. It's`,
        ` ${new Date().getHours()}`,
        `:${new Date().getMinutes()}`,
        `:${new Date().getSeconds()} o'clock`
    ].join(''));
}
