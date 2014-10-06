

					<div id="wpmoly-tmdb" class="wpmoly-tmdb">

						<div id="wpmoly-movie-meta-search" class="wpmoly-movie-meta-search">

							<p><strong><?php _e( 'Find movie on TMDb:', 'wpmovielibrary' ); ?></strong></p>

							<div>
								<?php wpmoly_nonce_field( 'search-movies' ) ?>
								<select id="tmdb_search_lang" name="wpmoly[lang]" onchange="wpmoly_edit_meta.lang=this.value;">
<?php foreach ( $languages as $code => $lang ) : ?>
									<option value="<?php echo $code ?>" <?php selected( wpmoly_o( 'api-language' ), $code ); ?>><?php echo $lang ?></option>
<?php endforeach; ?>
								</select>
								<select id="tmdb_search_type" name="wpmoly[tmdb_search_type]">
									<option value="title" selected="selected"><?php _e( 'Movie Title', 'wpmovielibrary' ); ?></option>
									<option value="id"><?php _e( 'TMDb ID', 'wpmovielibrary' ); ?></option>
								</select>
								<input id="tmdb_query" type="text" name="wpmoly[tmdb_query]" value="" size="30" maxlength="32" placeholder="<?php _e( 'ex: The Secret Life of Walter Mitty', 'wpmovielibrary' ); ?>" />
								<a id="tmdb_search" name="wpmoly[tmdb_search]" title="<?php _e( 'Search', 'wpmovielibrary' ); ?>" href="<?php echo get_edit_post_link() ?>&amp;wpmoly_auto_fetch=1" class="button button-secondary button-icon"><span class="dashicons dashicons-search"></span></a>
								<a id="tmdb_update" name="wpmoly[tmdb_update]" title="<?php _e( 'Update', 'wpmovielibrary' ); ?>" href="<?php echo get_edit_post_link() ?>&amp;wpmoly_auto_fetch=1" class="button button-secondary button-icon"><span class="dashicons dashicons-update"></span></a>
								<span class="spinner"></span>
								<?php wpmoly_nonce_field( 'empty-movie-meta' ) ?>
								<a id="tmdb_empty" name="wpmoly[tmdb_empty]" title="<?php _e( 'Empty Results', 'wpmovielibrary' ); ?>" class="button button-secondary button-empty button-icon hide-if-no-js"><span class="dashicons dashicons-no"></span></a>
							</div>

							<div id="wpmoly_status"><?php echo $status; ?></div>

<?php if ( ! is_null( $select ) ) : ?>
							<div id="meta_data" style="display:block">
<?php foreach ( $select as $movie ) : ?>

								<div class="tmdb_select_movie">
									<a id="tmdb_<?php echo $movie['id'] ?>" href="<?php echo wp_nonce_url( get_edit_post_link( get_the_ID() ) . "&amp;wpmoly_search_movie=1&amp;search_by=id&amp;search_query={$movie['id']}", 'search-movies' ) ?>" onclick="wpmoly_edit_meta.get( <?php echo $movie['id'] ?> ); return false;">
										<img src="<?php echo $movie['poster'] ?>" alt="<?php echo $movie['title'] ?>" />
										<em><?php echo $movie['title'] ?></em>
									</a>
									<input type="hidden" value='<?php echo $movie['json'] ?>' />
								</div>
<?php endforeach; ?>
							</div>
<?php else: ?>
							<div id="meta_data"></div>
<?php endif; ?>

							<input type="hidden" id="meta_data_tmdb_id" name="meta_data[tmdb_id]" class="hide-if-js hide-if-no-js" value="<?php echo $metadata['tmdb_id'] ?>" />
							<input type="hidden" id="wpmoly_actor_limit" class="hide-if-js hide-if-no-js" value="<?php echo wpmoly_o( 'actor-limit' ) ?>" />
							<input type="hidden" id="wpmoly_poster_featured" class="hide-if-js hide-if-no-js" value="<?php echo ( 1 == wpmoly_o( 'poster-featured' ) ? '1' : '0' ) ?>" />

						</div>

						<div id="wpmoly-movie-meta" class="wpmoly-movie-meta">
<?php 
foreach ( $metas as $slug => $meta ) :
	$value = '';
	if ( isset( $metadata[ $slug ] ) )
		$value = apply_filters( 'wpmoly_stringify_array', $metadata[ $slug ] );
?>
							<div class="wpmoly-movie-meta-edit wpmoly-movie-meta-edit-<?php echo $slug; ?> <?php echo $meta['size'] ?>">
								<div class="wpmoly-movie-meta-label">
									<label for="meta_data_<?php echo $slug; ?>"><?php _e( $meta['title'], 'wpmovielibrary' ) ?></label>
								</div>
								<div class="wpmoly-movie-meta-value">
<?php if ( 'textarea' == $meta['type'] ) : ?>
									<textarea id="meta_data_<?php echo $slug; ?>" name="meta[<?php echo $slug; ?>]" class="meta-data-field" rows="6"><?php echo $value ?></textarea>
<?php elseif ( in_array( $meta['type'], array( 'text', 'hidden' ) ) ) : ?>
									<input type="<?php echo $meta['type']; ?>" id="meta_data_<?php echo $slug; ?>" name="meta[<?php echo $slug; ?>]" class="meta-data-field" value="<?php echo $value ?>" />
<?php endif; ?>
								</div>
							</div>
<?php endforeach; ?>

						</div>

					</div>