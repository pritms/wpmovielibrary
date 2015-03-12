
window.wpmoly = window.wpmoly || {};
wpmoly.media = wpmoly.media || {};

(function( $ ) {

	var media = wpmoly.media;

	_.extend( wpmoly.media.View, {

		/**
		 * WPMOLY Backbone basic Attachment View
		 * 
		 * Handle each imported backdrop/poster/whatever's view. This View has
		 * to be extended to work. Required properties:
		 *  - _tmpl: View's template
		 *  - _type: View's type, backdrop/poster/whatever
		 * 
		 * @since    2.2
		 * 
		 * @return   void
		 */
		Attachment: Backbone.View.extend({

			tagName: 'li',

			events: {
				"click .wpmoly-imported-attachment-menu-toggle": "toggleMenu",
				"click .wpmoly-imported-attachment-menu-edit": "editAttachment",
				"click .wpmoly-imported-attachment-menu-delete": "deleteAttachment",
				"click .wpmoly-imported-attachment-menu-featured": "setFeatured",
			},

			/**
			 * Initialize the View
			 * 
			 * @since    2.2
			 * 
			 * @return   void
			 */
			initialize: function() {

				this.template = wp.template( this._tmpl );
				this.render();

				this.model.on( 'uploading:start', this.uploading, this );
				this.model.on( 'uploading:end', this.uploaded, this );
			},

			/**
			 * Render the View
			 * 
			 * @since    2.2
			 * 
			 * @return   void
			 */
			render: function() {

				this.$el.html( this.template( { attachment: this.model.toJSON(), type: this._type } ) );
				return this;
			},

			/**
			 * Starting upload, let's spin!
			 * 
			 * @since    2.2
			 * 
			 * @return   void
			 */
			uploading: function() {

				this.$el.addClass( 'wpmoly-' + this._type + '-loading' );
			},

			/**
			 * Done uploading, stop spinning!
			 * 
			 * @since    2.2
			 * 
			 * @return   void
			 */
			uploaded: function() {

				this.$el.removeClass( 'wpmoly-' + this._type + '-loading' );
			},

			/**
			 * Toggle Attachment custom menu
			 * 
			 * @since    2.2
			 * 
			 * @param    event    JS 'click' Event
			 * 
			 * @return   void
			 */
			toggleMenu: function( event ) {

				if ( undefined != event )
					event.preventDefault();

				this.$el.find( '.wpmoly-imported-attachment-menu' ).toggleClass( 'active' );
			},

			/**
			 * Close Attachment menu when editing
			 * 
			 * @since    2.2
			 * 
			 * @param    event    JS 'click' Event
			 * 
			 * @return   void
			 */
			editAttachment: function( event ) {

				this.toggleMenu();
			},

			/**
			 * Delete Attachment
			 * 
			 * @since    2.2
			 * 
			 * @param    event    JS 'click' Event
			 * 
			 * @return   void
			 */
			deleteAttachment: function( event ) {

				event.preventDefault();
				if ( true === confirm( wpmoly.l10n.misc.delete_attachment ) ) {
					this.model.trigger( 'destroy', this.model, this.collection, {} );
					this.collection.trigger( 'change', this );
					this.model.destroy();
				}
				this.toggleMenu();
			},

			/**
			 * Set Attachment as Featured Image
			 * 
			 * @since    2.2
			 * 
			 * @return   void
			 */
			setFeatured: function( event ) {

				event.preventDefault();
				wp.media.featuredImage.set( this.model.get( 'id' ) );
				this.toggleMenu();
			}
		})

	});
	
	_.extend( media.View, {

		/**
		 * WPMOLY Backbone basic Attachments View
		 * 
		 * Collection View to handle imported media views (Attachment View
		 * extends). This View has to be extended to work. Required properties:
		 *  - el: Collection View element
		 *  - _subview: Collection's models View
		 *  - _tmpl: View's template
		 *  - _type: View's type, backdrop/poster/whatever
		 *  - _library: View Library main state
		 * 
		 * @since    2.2
		 * 
		 * @return   void
		 */
		Attachments: wp.Backbone.View.extend({

			_views: [],

			/**
			 * Initialize the View
			 * 
			 * @since    2.2
			 * 
			 * @return   void
			 */
			initialize: function() {

				_.bindAll( this, 'render' );

				this.render();

				this.media = wp.media;
				this.modal = this.frame();

				this.collection.on( 'add', this.renderAttachment, this );
				this.collection.on( 'change', this.render, this );
			},

			/**
			 * Render the View
			 * 
			 * @since    2.2
			 * 
			 * @return   void
			 */
			render: function() {

				this.$el.find( '.wpmoly-imported-' + this._type ).remove();

				this.collection.forEach( this.renderAttachment, this );
				return this;
			},

			/**
			 * Render the Attachment subview
			 * 
			 * @since    2.2
			 * 
			 * @param    object    Attachment Model
			 * 
			 * @return   void
			 */
			renderAttachment: function( model ) {

				if ( undefined === this._subview )
					return;

				var view = new this._subview( { model: model, collection: this.collection, type: this._type } ),
				      el = view.render().el;

				this.$el.prepend( el );

				return view;
			},

			/**
			 * Open the Modal frame
			 * 
			 * @since    2.2
			 * 
			 * @param    object    JS Click Event
			 * 
			 * @return   void
			 */
			open: function( event ) {

				this.modal.open();
				event.preventDefault();
			},

			/**
			 * Create/return the Modal frame
			 * 
			 * @since    2.2
			 * 
			 * @return   void
			 */
			frame: function() {

				if ( this._frame )
					return this._frame;

				if ( true === this._filterbycountry )
					this.createLanguageFilter();

				this._frame = this.media( {
					state: this._library.id,
					states: this._library.state
				} );

				this._frame.on( 'open', this.classNames, this );

				this._frame.state( this._library.id ).on( 'select', this.select, this );
				this._frame.state( this._library.id ).get( 'library' ).on( 'add', this.filterLanguageFilters, this );
				this._frame.state( this._library.id ).get( 'library' ).on( 'selection:single selection:unsingle', this.selectionResize, this );

				wp.Uploader.queue.on( 'add', this.upload, this );

				return this._frame;
			},

			/**
			 * Add a custom Language filter to the AttachmentsBrowser
			 * 
			 * @since    2.2
			 */
			createLanguageFilter: function() {

				var media = this.media;
				var browser = media.view.AttachmentsBrowser;

				/**
				 * Customized AttachmentsBrowser
				 * 
				 * @since    2.2
				 */
				media.view.AttachmentsBrowser = media.view.AttachmentsBrowser.extend({

					/**
					 * Customize Toolbar
					 * 
					 * @since    2.2
					 */
					createToolbar: function() {

						// Prototype call
						browser.prototype.createToolbar.apply( this, arguments );

						// Custom Attachments Filter
						filters = media.view.AttachmentFilters.extend({

							id: 'media-attachment-language-filters',

							className: 'attachment-filters attachment-language-filters',

							initialize: function() {

								wp.media.view.AttachmentFilters.prototype.initialize.apply( this, arguments );

								// Make ALL languages disabled so that we can enable the available ones later
								this.$el.find( 'option' ).not( ':first' ).prop( 'disabled', true );
							},
							
							createFilters: function() {
								this.filters = wpmoly.l10n.languages;
							},

							change: function() {

								var  filter = this.filters[ this.el.value ],
								     models = this.controller.state().get( 'library' ).models,
								    browser = this.controller.state().frame.views.get('.media-frame-content')[0],
								attachments = browser.$el.find( 'li.attachment' );

								if ( undefined === models || ! models.length || '' == filter.code ) {
									attachments.removeClass( 'wpmoly-filtered-attachment' );
									return;
								}

								attachments.addClass( 'wpmoly-filtered-attachment' );

								_.map( models, function( model ) {
									if ( filter.code === model.get( 'metadata' ).iso_639_1 ) {
										var id = model.get( 'id' );
										attachments.filter( '[data-id="' + id + '"]' ).removeClass( 'wpmoly-filtered-attachment' );
									}
								} );
								
							},
						});

						this.toolbar.set( 'language', new filters({
								controller: this.controller,
								model: this.collection.props,
								priority: -80
							}).render()
						);
					}
				});
			},

			filterLanguageFilters: function( model, collection ) {

				var browser = this._frame.state().frame.views.get('.media-frame-content')[0],
				   language = browser.toolbar.secondary.get('language');

				language.$el.find( 'option[value="' + model.get( 'metadata' ).iso_639_1 + '"]' ).prop( 'disabled', false );
			},

			/**
			 * Mess with size attributes to show a bigger image
			 * in detail Sidebar.
			 * 
			 * @since    2.2
			 * 
			 * @param    object    Attachment Model
			 * 
			 * @return   void
			 */
			selectionResize: function( model ) {

				var thumbnail = _.clone( model.get( 'sizes' ).thumbnail ),
				       medium = _.clone( model.get( 'sizes' ).medium );
				model.attributes.sizes.thumbnail = medium;
				model.attributes.sizes.medium = thumbnail;
			},


			/**
			 * Hide Modal Menu
			 * 
			 * @since    2.2
			 * 
			 * @return   void
			 */
			classNames: function() {

				this._frame.$el.addClass( 'wpmoly-media-modal ' + this._type + '-modal hide-menu' );
			},

			/**
			 * Handle Attachments selection
			 * 
			 * @since    2.2
			 * 
			 * @return   void
			 */
			select: function() {

				var selection = this._frame.state( this._library.id ).get( 'selection' ),
				    models = selection.models;

				this.collection.add( models ).trigger( 'dequeue' );
			},

			/**
			 * Handle user attachment upload
			 * 
			 * Add each Attachment uploaded by the user to the collection
			 * 
			 * @since    2.2
			 * 
			 * @return   void
			 */
			upload: function( attachment ) {

				var attachments = attachment.collection.models,
					 models = this._frame.state( this._library.id ).get( 'library' ).models;
				    attachments = _.filter( attachments, function( obj ) { return ! _.findWhere( models, obj ); });

				_.each( attachments, function( _attachment ) {
					this._frame.state( this._library.id ).get( 'library' ).models.unshift( _attachment );
				}, this );
			}
		})

	});

	_.extend( wpmoly.media.View, {

		/**
		 * WPMOLY Backbone Backdrop View
		 * 
		 * Extends media.View.Attachment to set template ID and Attachment type
		 * 
		 * @since    2.2
		 * 
		 * @return   void
		 */
		Backdrop: media.View.Attachment.extend({

			className: 'wpmoly-backdrop wpmoly-imported-backdrop',
			_tmpl: 'wpmoly-imported-attachment',
			_type: 'backdrop',
		}),

		/**
		 * WPMOLY Backbone Poster View
		 * 
		 * Extends media.View.Attachment to set template ID and Attachment type
		 * 
		 * @since    2.2
		 * 
		 * @return   void
		 */
		Poster: media.View.Attachment.extend({

			className: 'wpmoly-poster wpmoly-imported-poster',
			_tmpl: 'wpmoly-imported-attachment',
			_type: 'poster',
		})

	});
	
	_.extend( media.View, {

		/**
		 * WPMOLY Backbone Backdrops View
		 * 
		 * Extends media.View.Attachments
		 * 
		 * @since    2.2
		 * 
		 * @return   void
		 */
		Backdrops: media.View.Attachments.extend({

			el: '#wpmoly-imported-backdrops',

			events: {
				"click #wpmoly-load-backdrops": "open"
			},

			_subview: media.View.Backdrop,

			_tmpl: 'wpmoly-imported-backdrops',

			_type: 'backdrop',

			_filterbycountry: false,

			_library: {
				id: 'backdrops',
				state: new wp.media.controller.Library({
					id:                 'backdrops',
					title:              function() {
						var title = wpmoly.editor.models.movie.get( 'title' )
						if ( '' != title && undefined != title )
							return wpmoly.l10n.media.backdrops.title.replace( '%s', title );
						return wpmoly.l10n.media.backdrops.default_title;
					},
					priority:           20,
					library:            wp.media.query( { type: 'backdrops', s: $( '#meta_data_tmdb_id' ).val(), post__in: [ $( '#post_ID' ).val() ] } ),
					content:            'browse',
					search:             false,
					searchable:         false,
					filterable:         false,
					multiple:           true,
					contentUserSetting: false
				})
			},

			/**
			 * Initialize the View.
			 * 
			 * @since    2.2
			 * 
			 * @return   this
			 */
			initialize: function() {

				media.View.Attachments.prototype.initialize.apply( this, arguments );

				// Bind to the editor sync:done event to set featured image
				this.listenTo( wpmoly.editor.models.movie, 'sync:done', this.reload );

				return ;
			},

			/**
			 * Preload the Backdrops by update the Modal collection with posters
			 * fetched along with metadata.
			 * 
			 * @since    2.2
			 * 
			 * @param    object    Attachment Model
			 * @param    object    Movie Metadata
			 * 
			 * @return   void
			 */
			reload: function( model, data ) {

				// Tricky: if modal hasn't been opened yet, open-close quickly.
				// Not doing means there's no collection to populate.
				if ( null == this.modal.content.get( 'backdrops' ) )
					this.modal.open().close();

				this.modal.content.get( 'backdrops' ).collection.add( data.images );

				wpmoly.metabox.models.metabox.state( 'images' ).set({
					label: data.images.length,
					labeltitle: ( data.images.length > 1 ? wpmoly.l10n.media.backdrops.available.replace( '%d', data.images.length ) : wpmoly.l10n.media.backdrop.available )
				});

				var imports = wpmoly.editor.models.movie.settings.importimages;
				if ( -1 == imports || 0 < imports )
					this.importBackdrops();
			},

			/**
			 * Import a specified number of backdrops along with meta.
			 * 
			 * @since    2.2
			 * 
			 * @return   this
			 */
			importBackdrops: function() {

				backdrops = this.modal.content.get( 'backdrops' ).collection;
				if ( _.isEmpty( backdrops ) )
					return this;

				var     q = wpmoly.editor.models.movie.settings.importimages;
				backdrops = backdrops.slice( Math.max( 0, backdrops.length - q ), Math.max( q, backdrops.length ) );

				// Upload
				this.collection.add( backdrops );
				this.collection.trigger( 'dequeue' );

				return this;
			}

		}),

		/**
		 * WPMOLY Backbone Posters View
		 * 
		 * Extends media.View.Attachments
		 * 
		 * @since    2.2
		 * 
		 * @return   void
		 */
		Posters: media.View.Attachments.extend({

			el: '#wpmoly-imported-posters',

			events: {
				"click #wpmoly-load-posters": "open"
			},

			_subview: media.View.Poster,

			_tmpl: 'wpmoly-imported-posters',

			_type: 'poster',

			_filterbycountry: true,

			_library: {
				id: 'posters',
				state: new wp.media.controller.Library({
					id:                 'posters',
					title:              function() {
						var title = wpmoly.editor.models.movie.get( 'title' )
						if ( '' != title && undefined != title )
							return wpmoly.l10n.media.posters.title.replace( '%s', title );
						return wpmoly.l10n.media.posters.default_title;
					},
					priority:           20,
					library:            wp.media.query( { type: 'posters', s: $( '#meta_data_tmdb_id' ).val(), post__in: [ $( '#post_ID' ).val() ] } ),
					content:            'browse',
					search:             false,
					searchable:         false,
					filterable:         false,
					multiple:           true,
					contentUserSetting: false
				})
			},

			/**
			 * Initialize the View.
			 * 
			 * @since    2.2
			 * 
			 * @return   this
			 */
			initialize: function() {

				media.View.Attachments.prototype.initialize.apply( this, arguments );

				// Bind to the editor sync:done event to set featured image
				if ( 1 == wpmoly.editor.models.movie.settings.setfeatured )
					this.listenTo( wpmoly.editor.models.movie, 'sync:done', this.setFeatured );

				this.listenTo( wpmoly.editor.models.movie, 'sync:done', this.reload );

				return ;
			},

			/**
			 * Preload the Posters by update the Modal collection with posters
			 * fetched along with metadata.
			 * 
			 * @since    2.2
			 * 
			 * @param    object    Attachment Model
			 * @param    object    Movie Metadata
			 * 
			 * @return   void
			 */
			reload: function( model, data ) {

				// Tricky: if modal hasn't been opened yet, open-close quickly.
				// Not doing means there's no collection to populate.
				if ( null == this.modal.content.get( 'posters' ) )
					this.modal.open().close();

				this.modal.content.get( 'posters' ).collection.add( data.posters );

				wpmoly.metabox.models.metabox.state( 'posters' ).set({
					label: data.posters.length,
					labeltitle: ( data.posters.length > 1 ? wpmoly.l10n.media.posters.available.replace( '%d', data.posters.length ) : wpmoly.l10n.media.poster.available )
				});
			},

			/**
			 * Set an Attachment as Featured Image.
			 * 
			 * @since    2.2
			 * 
			 * @param    object    Attachment Model
			 * @param    object    Movie Metadata
			 * 
			 * @return   this
			 */
			setFeatured: function( model, data ) {

				var attr = _.first( data.posters );
				if ( undefined == attr )
					return false;

				// Create needed Attachment Model
				var poster = new media.Model.Poster( _.extend( attr, { type: 'poster' } ) );
				this.collection.add( [ poster ], { upload: false } );

				// Wait for the upload to end
				poster.on( 'uploading:end', function( response ) {

					poster.set( { id: response } );
					poster.fetch();
					poster.trigger( 'uploading:done', poster );

					wp.media.featuredImage.set( poster.get( 'id' ) );
				}, this );

				poster.upload();
			}

		})

	});

})(jQuery);