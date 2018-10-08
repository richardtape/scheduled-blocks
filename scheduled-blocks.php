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
 * Version:      0.2.4
 * Author:       Richard Tape
 * Requires PHP: 7
 * Author URI:   https://scheduledblocks.com/
 * Text Domain:  scheduled-blocks
 * License:      GPL-2.0+
 * License URI:  http://www.gnu.org/licenses/gpl-2.0.txt
 * Icon1x:       https://raw.githubusercontent.com/froger-me/wp-plugin-update-server/master/examples/icon-128x128.png
 * Icon2x:       https://raw.githubusercontent.com/froger-me/wp-plugin-update-server/master/examples/icon-256x256.png
 * BannerHigh:   https://raw.githubusercontent.com/froger-me/wp-plugin-update-server/master/examples/banner-1544x500.png
 * BannerLow:    https://raw.githubusercontent.com/froger-me/wp-plugin-update-server/master/examples/banner-722x250.png
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Load our required files.
require_once 'lib/class-scheduled-blocks.php';
require_once plugin_dir_path( __FILE__ ) . 'lib/wp-package-updater/class-wp-package-updater.php';

$shceduled_blocks = new WP_Package_Updater(
	'https://scheduledblocksdotcom.local',
	wp_normalize_path( __FILE__ ),
	wp_normalize_path( plugin_dir_path( __FILE__ ) ),
	true
);

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
