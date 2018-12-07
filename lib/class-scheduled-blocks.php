<?php

/**
 * Scheduled Blocks: Scheduled_Blocks class
 *
 * @package scheduledblocks
 * @since 0.2.0
 */

/**
 * Main class which handles manipulating the content.
 *
 * @since 0.2.0
 */
class Scheduled_Blocks {

	/**
	 * Our main initialization. Add our hooks.
	 *
	 * @return void
	 */
	public function init() {

		$this->add_hooks();

	}// end init()

	/**
	 * Add our actions and filters
	 *
	 * @return void
	 */
	public function add_hooks() {

		// Add our editor assets.
		add_action( 'enqueue_block_editor_assets', array( $this, 'scheduled_blocks_editor_assets' ) );

		// Filter the_content to remove appropriate scheduled blocks before Gutenberg parses it
		add_filter( 'the_content', array( $this, 'the_content__scheduled_blocks_filter_content' ), 5 );

	}// end add_hooks()

	/**
	 * Enqueue Gutenberg block assets for backend editor.
	 *
	 * @since 0.0.1
	 */
	public function scheduled_blocks_editor_assets() {

		wp_register_script(
			'scheduled-blocks-block-js',
			plugins_url( '/dist/blocks.build.js', dirname( __FILE__ ) ),
			array( 'wp-blocks', 'wp-i18n', 'wp-element' ),
			filemtime( plugin_dir_path( dirname( __FILE__ ) ) . 'dist/blocks.build.js' ),
			true
		);

		$translation_array = array(
			'valid_block_types' => $this->scheduled_blocks_get_valid_block_types(),
		);
		wp_localize_script( 'scheduled-blocks-block-js', 'scheduledBlocksPHPData', $translation_array );

		// Scripts.
		wp_enqueue_script( 'scheduled-blocks-block-js' );

		// Styles.
		wp_enqueue_style(
			'scheduled-blocks-block-editor-css',
			plugins_url( 'dist/blocks.editor.build.css', dirname( __FILE__ ) ),
			array( 'wp-edit-blocks' ),
			filemtime( plugin_dir_path( dirname( __FILE__ ) ) . 'dist/blocks.editor.build.css' )
		);

	} // end scheduled_blocks_editor_assets().

	/**
	 * Parses dynamic blocks out of `post_content` and re-renders them.
	 * Removes any block that shouldn't be shown now. Runs on the_content
	 * filter at priority 7 because Gutenberg runs `do_blocks()` at priority 9.
	 *
	 * @since 0.0.1
	 * @global WP_Post $post The post to edit.
	 *
	 * @param  string $content Post content.
	 * @return string          Updated post content.
	 */
	public function the_content__scheduled_blocks_filter_content( $content ) {

		// We don't want to change anything in the admin.
		if ( is_admin() ) {
			return $content;
		}

		// No blocks? Then we don't need to do anything.
		if ( ! has_blocks( $content ) ) {
			return $content;
		}

		// No scheduled blocks? Then lets get out of the way.
		if ( ! $this->scheduled_blocks_content_has_scheduled_blocks( $content ) ) {
			return $content;
		}

		$scheduled_blocks = static::scheduled_blocks_extract_scheduled_blocks_from_content( $content );

		if ( empty( $scheduled_blocks ) ) {
			return $content;
		}

		// We now have our $scheduled_blocks. We need to check if each of these blocks needs
		// to be removed.
		$block_ids_to_remove = array();

		// We'll need to compare schedules to now.
		// If now > scheduledStart and ( now < scheduledEnd or no scheduledEnd ) then leave it.
		// if now < scheduledStart then remove
		// if now > scheduledEnd then remove
		// Gutenberg saves the data in YYYY-MM-DDTHH:MM:SS
		// $current_datetime = date( 'Y-m-d H:i:s' );
		$current_datetime = current_time( 'mysql' );

		foreach ( $scheduled_blocks as $id => $block ) {
			if ( static::block_should_be_removed( $block ) ) {
				$block_ids_to_remove[] = $id;
			}
		}

		// If there's no blocks to remove, then bail
		if ( empty( $block_ids_to_remove ) ) {
			return $content;
		}

		// OK, we have some blocks to remove from the content.
		foreach ( $block_ids_to_remove as $useless => $block_id_to_remove ) {

			$this_block_to_remove = $scheduled_blocks[ $block_id_to_remove ];

			$content = static::scheduled_blocks_remove_html_from_content( $this_block_to_remove['innerHTML'], $content );
		}

		return $content;

	}// end the_content__scheduled_blocks_filter_content()

	/**
	 * Determine if a block should be removed based on the current date and time
	 * and the shceduledStart/End date on the block.
	 *
	 * @param array $block The block to say if it should be removed or not
	 * @return bool true if this block should be removed from the content, false otherwise.
	 */
	public static function block_should_be_removed( $block = array() ) {

		$current_datetime = current_time( 'mysql' );

		if ( isset( $block['attrs']['scheduledStart'] ) ) {

			$scheduled_start = DateTime::createFromFormat( 'Y-m-d\TH:i:s', $block['attrs']['scheduledStart'] );
			if ( is_a( $scheduled_start, 'DateTime' ) ) {
				$scheduled_start = $scheduled_start->format( 'Y-m-d H:i:s' );
			}

			if ( $current_datetime <= $scheduled_start ) {
				return true;
			}
		}

		if ( isset( $block['attrs']['scheduledEnd'] ) ) {

			$scheduled_end = DateTime::createFromFormat( 'Y-m-d\TH:i:s', $block['attrs']['scheduledEnd'] );
			if ( is_a( $scheduled_end, 'DateTime' ) ) {
				$scheduled_end = $scheduled_end->format( 'Y-m-d H:i:s' );
			}

			if ( $current_datetime >= $scheduled_end ) {
				return true;
			}
		}

		return false;

	}// end determine_if_block_should_be_removed()

	/**
	 * Remove the passed $html_to_remove from the passed $content string.
	 *
	 * @param string $html_to_remove What to remove
	 * @param string $content what to remove $html_to_remove from
	 * @return string the resultant content string
	 */
	public static function scheduled_blocks_remove_html_from_content( $html_to_remove = '', $content = '' ) {

		$result = str_replace( trim( $html_to_remove ), '', $content );

		return $result;

	}// end scheduled_blocks_remove_html_from_content()

	/**
	 * Parse out the Gutenberg blocks from the passed content.
	 *
	 * @todo Look into Gutenberg's gutenberg_parse_blocks()
	 *
	 * @param string $content The content from which to parse the blocks
	 * @return array An array of block data for scheduled blocks
	 */
	public static function scheduled_blocks_extract_scheduled_blocks_from_content( $content ) {

		$parser = new WP_Block_Parser();
		$blocks = $parser->parse( $content );

		if ( empty( $blocks ) ) {
			return array();
		}

		$scheduled_blocks = array();

		// Find scheduled blocks and capture their innerHTML
		foreach ( $blocks as $id => $block_details ) {

			$this_block = static::scheduled_blocks_get_usable_data_from_block_details( $block_details );

			if ( empty( $this_block ) ) {
				continue;
			}

			$scheduled_blocks[] = $this_block;
		}

		return $scheduled_blocks;

	}// end scheduled_blocks_extract_scheduled_blocks_from_content()

	/**
	 * A (potentially recursive) function that extracts usable data for blocks
	 * that have a schedule component.
	 *
	 * @param array $block_details The name, attributes, and innerHTML of blocks
	 * @return array Either an empty array if it's not a scheduled block, or an array with block details
	 */
	public static function scheduled_blocks_get_usable_data_from_block_details( $block_details = array() ) {

		$block_details = apply_filters( 'scheduled_blocks_get_usable_data_from_block_details_start', $block_details );

		// We also need to take into account Reusable blocks. This has ['attrs]['ref']
		// with a value of a post ID. That post content holds the raw content of this reusable block.
		// This attribute gets set by our add-on.
		do_action( 'scheduled_blocks_get_usable_data_from_block_details_handle_special', $block_details );

		// If we have innerBlocks then we need to send them back around
		if ( isset( $block_details['innerBlocks'] ) && is_array( $block_details['innerBlocks'] ) && ! empty( $block_details['innerBlocks'] ) ) {
			foreach ( $block_details['innerBlocks'] as $id => $inner_block_details ) {
				$block_details = static::scheduled_blocks_get_usable_data_from_block_details( $inner_block_details );
			}
		}

		// Ensure that we only capture scheduled blocks
		if ( ! isset( $block_details['attrs'] ) || empty( $block_details['attrs'] ) ) {
			return array();
		}

		if ( ! isset( $block_details['attrs']['scheduledStart'] ) && ! isset( $block_details['attrs']['scheduledEnd'] ) ) {
			return array();
		}

		$this_block = array(
			'blockName' => $block_details['blockName'],
			'attrs'     => $block_details['attrs'],
			'innerHTML' => $block_details['innerHTML'],
		);

		return $this_block;

	}// end scheduled_blocks_get_usable_data_from_block_details()

	/**
	 * The regex pattern for scheduled blocks
	 *
	 * @todo Work out what to do for custom blocks not under the core/ namespace
	 *
	 * @return string the regex pattern
	 */
	public function scheduled_blocks_get_scheduled_blocks_pattern() {

		$block_pattern = (
			'/<!--\s+wp:(' .
			str_replace(
				'/',
				'\/',                 // Escape namespace, not handled by preg_quote.
				str_replace(
					'core/',
					'(?:core/)?', // Allow implicit core namespace, but don't capture.
					implode(
						'|',                   // Join block names into capture group alternation.
						array_map(
							'preg_quote',    // Escape block name for regular expression.
							$this->scheduled_blocks_get_valid_block_types( false )
						)
					)
				)
			) .
			')(\s+(\{.*?\}))?\s+(\/)?-->/'
		);

		return $block_pattern;

	}// end scheduled_blocks_get_scheduled_blocks_pattern()

	/**
	 * Test if the passed content string has any scheduled blocks. This will have
	 * the string `"scheduledStart":` or `"scheduledEnd":` in it if so.
	 *
	 * @param string $content
	 * @return bool true if the passed $content has scheduled blocks. False otherwise.
	 */
	public function scheduled_blocks_content_has_scheduled_blocks( $content = '' ) {

		// Bail early if we're not passed anything.
		if ( empty( $content ) ) {
			return false;
		}

		// The strings to look for
		$scheduled_block_strings = array(
			'"scheduledStart":',
			'"scheduledEnd":',
		);

		foreach ( $scheduled_block_strings as $id => $scheduled_block_string ) {

			// Bail immediately if we find a match.
			if ( strpos( $content, $scheduled_block_string ) !== false ) {
				return true;
			}
		}

		// If we get here, then we didn't find a match.
		return false;

	}// end scheduled_blocks_content_has_scheduled_blocks()

	/**
	 * Return the array of supported block types. $with_front allows us to use this
	 * function for sending the data as needed in our javascript, as well as using
	 * it for the regex to look at blocks.
	 *
	 * @param boolean $with_front Whether to append core/ to the front of each block name
	 * @return array valid block types
	 */
	public function scheduled_blocks_get_valid_block_types( $with_front = true ) {

		$valid_core_types = array(
			'paragraph',
			'image',
			'heading',
			'gallery',
			'list',
			'quote',
			'shortcode',
			'archives',
			'audio',
			'button',
			'categories',
			'code',
			'cover-image',
			'embed',
			'file',
			'freeform',
			'html',
			'latest-comments',
			'latest-posts',
			'more',
			'nextpage',
			'preformatted',
			'pullquote',
			'separator',
			'spacer',
			'subhead',
			'table',
			'template',
			'text-columns',
			'verse',
			'video',
		);

		$valid_core_types = apply_filters( 'scheduled_blocks_valid_block_types', $valid_core_types, $with_front );

		// Custom add-ons will always provide the namespace.
		$valid_addon_types = apply_filters( 'scheduled_blocks_valid_addon_block_types', array(), $with_front );

		// Prepend "core/" if we're passed $with_front
		if ( true === $with_front ) {
			$valid_core_types = preg_filter( '/^/', 'core/', $valid_core_types );
		}

		return array_merge( $valid_core_types, $valid_addon_types );

	}//end scheduled_blocks_get_valid_block_types()

}// end class Scheduled_Blocks
