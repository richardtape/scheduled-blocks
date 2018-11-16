<?php
/**
 * Scheduled Blocks
 *
 * @package     scheduled-blocks
 * @author      Richard Tape
 * @copyright   2018 Richard Tape
 * @license     GPL-3.0+
 *
 * @wordpress-plugin
 * Plugin Name:  Scheduled Blocks
 * Plugin URI:   https://scheduledblocks.com/
 * Description:  Schedule when your blocks should go live (and when they should stop being live)
 * Version:      0.5.0
 * Author:       Richard Tape
 * Requires PHP: 7
 * Author URI:   https://scheduledblocks.com/
 * Text Domain:  scheduled-blocks
 * License:      GPL-2.0+
 * License URI:  http://www.gnu.org/licenses/gpl-3.0.txt
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Load our required files.
require_once plugin_dir_path( __FILE__ ) . 'lib/class-scheduled-blocks.php';

/**
 * Initialize ourselves!
 *
 * @return void
 */
function plugins_loaded__scheduled_blocks_init() {

	$scheduled_blocks_go = new Scheduled_Blocks();
	$scheduled_blocks_go->init();

}// end plugins_loaded__scheduled_blocks_init()

add_action( 'plugins_loaded', 'plugins_loaded__scheduled_blocks_init' );
