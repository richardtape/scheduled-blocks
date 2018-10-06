<?php
/**
 * Scheduled Blocks
 *
 * @package     scheduled-blocks
 * @author      Richard Tape
 * @copyright   2018 Richard Tape
 * @license     GPL-2.0+
 *
 * @wordpress-plugin
 * Plugin Name:  Scheduled Blocks
 * Plugin URI:   https://scheduledblocks.com/
 * Description:  Schedule when your blocks should go live (and when they should stop being live)
 * Version:      0.1.0
 * Author:       Richard Tape
 * Requires PHP: 7
 * Author URI:   https://scheduledblocks.com/
 * Text Domain:  scheduled-blocks
 * License:      GPL-2.0+
 * License URI:  http://www.gnu.org/licenses/gpl-2.0.txt
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Enqueue Gutenberg block assets for backend editor.
 *
 * @since 0.0.1
 */
function scheduled_blocks_editor_assets() {

	wp_register_script(
		'scheduled-blocks-block-js',
		plugins_url( '/dist/blocks.build.js', __FILE__ ),
		array( 'wp-blocks', 'wp-i18n', 'wp-element' ),
		filemtime( plugin_dir_path( __FILE__ ) . 'dist/blocks.build.js' ),
		true
	);

	$translation_array = array(
		'valid_block_types' => scheduled_blocks_get_valid_block_types(),
	);
	wp_localize_script( 'scheduled-blocks-block-js', 'scheduledBlocksPHPData', $translation_array );

	// Scripts.
	wp_enqueue_script( 'scheduled-blocks-block-js' );

	// Styles.
	wp_enqueue_style(
		'scheduled-blocks-block-editor-css',
		plugins_url( 'dist/blocks.editor.build.css', __FILE__ ),
		array( 'wp-edit-blocks' ),
		filemtime( plugin_dir_path( __FILE__ ) . 'dist/blocks.editor.build.css' )
	);

} // end scheduled_blocks_editor_assets().

// Add our editor assets.
add_action( 'enqueue_block_editor_assets', 'scheduled_blocks_editor_assets' );

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
function the_content__scheduled_blocks_filter_content( $content ) {

	// We don't want to change anything in the admin.
	if ( is_admin() ) {
		return $content;
	}

	// No blocks? Then we don't need to do anything.
	if ( ! has_blocks( $content ) ) {
		return $content;
	}

	// No scheduled blocks? Then lets get out of the way.
	if ( ! scheduled_blocks_content_has_scheduled_blocks( $content ) ) {
		return $content;
	}

	$scheduled_blocks = scheduled_blocks_extract_scheduled_blocks_from_content( $content );

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
	$current_datetime = date( 'Y-m-d H:i:s' );

	foreach ( $scheduled_blocks as $id => $block ) {

		if ( isset( $block['attrs']['scheduledStart'] ) ) {

			// $scheduled_start = DateTime::createFromFormat( 'Y:m:d H:i:s', $block['attrs']['scheduledStart'] )->format( 'Y:m:d H:i:s' );
			$scheduled_start = DateTime::createFromFormat( 'Y-m-d\TH:i:s', $block['attrs']['scheduledStart'] );
			if ( is_a( $scheduled_start, 'DateTime' ) ) {
				$scheduled_start = $scheduled_start->format( 'Y-m-d H:i:s' );
			}

			if ( $current_datetime <= $scheduled_start ) {
				$block_ids_to_remove[] = $id;
			}
		}

		if ( isset( $block['attrs']['scheduledEnd'] ) ) {

			// $scheduled_end = DateTime::createFromFormat( 'Y:m:d H:i:s', $block['attrs']['scheduledEnd'] )->format( 'Y:m:d H:i:s' );
			$scheduled_end = DateTime::createFromFormat( 'Y-m-d\TH:i:s', $block['attrs']['scheduledEnd'] );
			if ( is_a( $scheduled_end, 'DateTime' ) ) {
				$scheduled_end = $scheduled_end->format( 'Y-m-d H:i:s' );
			}

			if ( $current_datetime >= $scheduled_end ) {
				$block_ids_to_remove[] = $id;
			}
		}
	}

	// If there's no blocks to remove, then bail
	if ( empty( $block_ids_to_remove ) ) {
		return $content;
	}

	// OK, we have some blocks to remove from the content.
	foreach ( $block_ids_to_remove as $useless => $block_id_to_remove ) {

		$this_block_to_remove = $scheduled_blocks[ $block_id_to_remove ];

		// check if this is a 'special' block (which is basically a parent block with a schedule)
		// if ( isset( $this_block_to_remove['special'] ) && true === $this_block_to_remove['special'] ) {

		// }

		$html_to_remove_from_content = $this_block_to_remove['innerHTML'];

		$content = str_replace( $html_to_remove_from_content, '', $content );

	}

	return $content;

}// end the_content__scheduled_blocks_filter_content()

add_filter( 'the_content', 'the_content__scheduled_blocks_filter_content', 5 );

/**
 * Parse out the Gutenberg blocks from the passed content.
 *
 * @todo Look into Gutenberg's gutenberg_parse_blocks()
 *
 * @param string $content The content from which to parse the blocks
 * @return array An array of block data for scheduled blocks
 */
function scheduled_blocks_extract_scheduled_blocks_from_content( $content ) {

	// @todo When moved to core, change this
	if ( ! class_exists( 'Gutenberg_PEG_Parser' ) ) {
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'gutenberg/lib/parser.php';
	}

	$parser = new Gutenberg_PEG_Parser();
	$blocks = $parser->parse( _gutenberg_utf8_split( $content ) );

	if ( empty( $blocks ) ) {
		return array();
	}

	$scheduled_blocks = array();

	// Find scheduled blocks and capture their innerHTML
	foreach ( $blocks as $id => $block_details ) {

		$this_block = scheduled_blocks_get_usable_data_from_block_details( $block_details );

		if ( empty( $block_details ) ) {
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
function scheduled_blocks_get_usable_data_from_block_details( $block_details = array() ) {

	// If we have innerBlocks AND (attrs['scheduledStart] or attrs['scheduledEnd'] then
	// the user has added the schedule to the parent (think the columns block rather than
	// the paragraph block inside a column). The innerHTML property for the parent block
	// is simply the markup for the parent, it does not contain the markup for its children.
	// We mark this as a special case and handle it differently when removing from the_content
	if ( isset( $block_details['innerBlocks'] ) && is_array( $block_details['innerBlocks'] ) && ! empty( $block_details['innerBlocks'] ) && ( isset( $block_details['attrs']['scheduledStart'] ) || isset( $block_details['attrs']['scheduledEnd'] ) ) ) {

		$this_block = array(
			'blockName'   => $block_details['blockName'],
			'attrs'       => $block_details['attrs'],
			'innerHTML'   => $block_details['innerHTML'],
			'innerBlocks' => $block_details['innerBlocks'],
			'special'     => true,
		);

		return $this_block;

	}

	// If we have innerBlocks then we need to send them back around
	if ( isset( $block_details['innerBlocks'] ) && is_array( $block_details['innerBlocks'] ) && ! empty( $block_details['innerBlocks'] ) ) {
		foreach ( $block_details['innerBlocks'] as $id => $inner_block_details ) {
			$block_details = scheduled_blocks_get_usable_data_from_block_details( $inner_block_details );
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
function scheduled_blocks_get_scheduled_blocks_pattern() {

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
						// array(
						// 	'heading',
						// )
						scheduled_blocks_get_valid_block_types( false )
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
function scheduled_blocks_content_has_scheduled_blocks( $content = '' ) {

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
function scheduled_blocks_get_valid_block_types( $with_front = true ) {

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
		'columns',
		'column',
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
		'block',
		'spacer',
		'subhead',
		'table',
		'template',
		'text-columns',
		'verse',
		'video',
	);

	// Prepend "core/" if we're passed $with_front
	if ( true === $with_front ) {
		$valid_core_types = preg_filter( '/^/', 'core/', $valid_core_types );
	}

	return apply_filters( 'scheduled_blocks_valid_block_types', $valid_core_types, $with_front );

}//end scheduled_blocks_get_valid_block_types()
