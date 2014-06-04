<?php
/**
 * WPMovieLibrary Dashboard Class extension.
 * 
 * Create a Movies preview Widget.
 *
 * @package   WPMovieLibrary
 * @author    Charlie MERLAND <charlie.merland@gmail.com>
 * @license   GPL-3.0
 * @link      http://www.caercam.org/
 * @copyright 2014 CaerCam.org
 */

if ( ! class_exists( 'WPML_Dashboard_Latest_Movies_Widget' ) ) :

	class WPML_Dashboard_Latest_Movies_Widget extends WPML_Dashboard {

		/**
		 * Widget ID
		 * 
		 * @since    1.0.0
		 * 
		 * @var      string
		 */
		protected $widget_id = '';

		/**
		 * Widget Name.
		 * 
		 * @since    1.0.0
		 * 
		 * @var      string
		 */
		protected $widget_name = '';

		/**
		 * Widget callback method.
		 * 
		 * @since    1.0.0
		 * 
		 * @var      array
		 */
		protected $callback = null;

		/**
		 * Widget Controls callback method.
		 * 
		 * @since    1.0.0
		 * 
		 * @var      array
		 */
		protected $control_callback = null;

		/**
		 * Widget callback method arguments.
		 * 
		 * @since    1.0.0
		 * 
		 * @var      array
		 */
		protected $callback_args = null;

		/**
		 * Widget settings.
		 * 
		 * @since    1.0.0
		 * 
		 * @var      array
		 */
		protected $settings = null;

		/**
		 * Constructor
		 *
		 * @since   1.0.0
		 */
		public function __construct() {

			$this->init();
			$this->register_hook_callbacks();
		}

		/**
		 * Initializes variables
		 *
		 * @since    1.0.0
		 */
		public function init() {

			$this->widget_id = 'wpml_dashboard_latest_movies_widget';
			$this->widget_name = __( 'Movies you recently added', WPML_SLUG );
			$this->callback = array( $this, 'dashboard_widget' );
			$this->control_callback = array( $this, 'dashboard_widget_handle' );
			$this->callback_args = array( 'id' => $this->widget_id );

			$this->settings = $this->dashboard_widget_settings();
		}

		/**
		 * Register callbacks for actions and filters
		 * 
		 * @since    1.0.0
		 */
		public function register_hook_callbacks() {

			add_action( 'wpml_dashboard_setup', array( $this, '_add_dashboard_widget' ), 10 );

			if ( '1' == $this->settings['style_metabox'] )
				add_action( 'admin_footer', array( $this, 'dashboard_widget_metabox_style' ), 10 );
		}

		/**
		 * Register the Widget
		 * 
		 * @since    1.0.0
		 */
		public function _add_dashboard_widget() {

			$this->add_dashboard_widget( $this->widget_id, $this->widget_name, $this->callback, $this->control_callback );
		}

		/**
		 * Widget Settings. Get the stored Widget Settings if existing,
		 * save default settings if none.
		 * 
		 * @since    1.0.0
		 * 
		 * @return   array    Widget Settings.
		 */
		private function dashboard_widget_settings() {

			$widget_id = $this->widget_id;
			$defaults = array(
				'movies_per_page' => 8,
				'show_year' => 1,
				'show_rating' => 1,
				'show_more' => 1,
				'show_modal' => 1,
				'show_quickedit' => 1,
				'style_posters' => 1,
				'style_metabox' => 1
			);
			$settings = get_user_option( $widget_id . '_settings' );

			if ( ! $settings ) {
				update_user_option( get_current_user_id(), $widget_id . '_settings', $defaults );
				$settings = $defaults;
			}
			else
				$settings = wp_parse_args( $settings, $defaults );

			return $settings;
		}

		/**
		 * JavaScript part to apply custom styling on plugin Metaboxes.
		 * 
		 * This can't be done in PHP so we need to add a small JS code
		 * to add a class the Metaboxes selected to be stylized.
		 * 
		 * @since    1.0.0
		 */
		public function dashboard_widget_metabox_style() {

			printf( '<script type="text/javascript">document.getElementById("%s").classList.add("no-style");</script>', $this->widget_id );
		}

		/**
		 * Widget content.
		 * 
		 * Show a list of the most recently added movies with a panel of
		 * settings to customize the view.
		 * 
		 * @since    1.0.0
		 */
		public function dashboard_widget() {

			global $wpdb;

			$movies = $wpdb->get_results(
				'SELECT p.*, m.meta_value AS meta, mm.meta_value AS rating
				 FROM ' . $wpdb->posts . ' AS p
				 LEFT JOIN ' . $wpdb->postmeta . ' AS m ON m.post_id=p.ID AND m.meta_key="_wpml_movie_data"
				 LEFT JOIN ' . $wpdb->postmeta . ' AS mm ON mm.post_id=p.ID AND mm.meta_key="_wpml_movie_rating"
				 WHERE post_type="movie"
				   AND post_status="publish"
				 GROUP BY p.ID
				 ORDER BY post_date DESC
				 LIMIT 0,8'
			);

			if ( ! empty( $movies ) ) {
				foreach ( $movies as $movie ) {

					$movie->meta = unserialize( $movie->meta );
					$movie->meta = array(
						'title' => apply_filters( 'the_title', $movie->meta['meta']['title'] ),
						'runtime' => apply_filters( 'wpml_filter_filter_runtime', $movie->meta['meta']['runtime'] ),
						'release_date' => apply_filters( 'wpml_filter_filter_release_date', $movie->meta['meta']['release_date'], 'Y' ),
						'overview' => apply_filters( 'the_content', $movie->meta['meta']['overview'] )
					);
					$movie->year = $movie->meta['release_date'];
					$movie->meta = json_encode( $movie->meta );

					if ( has_post_thumbnail( $movie->ID ) ) {
						$movie->poster = wp_get_attachment_image_src( get_post_thumbnail_id( $movie->ID ), 'large' );
						$movie->poster = $movie->poster[0];
					}
					else
						$movie->poster = WPML_DEFAULT_POSTER_URL;

					$attachments = get_children( $args = array( 'post_parent' => $movie->ID, 'post_type' => 'attachment' ) );
					if ( ! empty( $attachments ) ) {
						shuffle( $attachments );
						$movie->backdrop = wp_get_attachment_image_src( $attachments[0]->ID, 'full' );
						$movie->backdrop = $movie->backdrop[0];
					}
					else
						$movie->backdrop = $movie->poster;
				}
			}

			$editing = false;
			$settings = $this->dashboard_widget_settings();
			include( WPML_PATH . '/admin/dashboard/views/dashboard-latest-movies-widget-config.php' );

			$class = 'wpml-movie';

			if ( '1' == $settings['show_year'] )
				$class .= ' with-year';
			if ( '1' == $settings['show_rating'] )
				$class .= ' with-rating';
			if ( '1' == $settings['style_posters'] )
				$class .= ' stylized';
			if ( '1' == $settings['show_modal'] )
				$class .= ' modal';

			include_once( WPML_PATH . '/admin/dashboard/views/dashboard-latest-movies-widget.php' );
		}

		/**
		 * Widget's configuration callback
		 * 
		 * @since    1.0.0
		 * 
		 * @param    string    $context box context
		 * @param    mixed     $object gets passed to the box callback function as first parameter
		 */
		public function dashboard_widget_handle( $context, $object ) {

			$settings = $this->dashboard_widget_settings();
			$editing = ( isset( $_GET['edit'] ) && $object['id'] == $_GET['edit'] );

			include( WPML_PATH . '/admin/dashboard/views/dashboard-latest-movies-widget-config.php' );
		}

	}

endif;