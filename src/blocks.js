/**
 * WordPress dependencies
 */
const { assign } = lodash;
const { __ } = wp.i18n;
const { Fragment } = wp.element;
const { addFilter } = wp.hooks;
const { TextControl, PanelBody } = wp.components;
const { hasBlockSupport } = wp.blocks;
const { createHigherOrderComponent } = wp.compose;
const { InspectorControls } = wp.editor;

/**
 * Which block types supprt scheduling? This comes from PHP.
 */
const validBlockTypes = scheduledBlocksPHPData.valid_block_types;

/**
 * Is the passed block name one which supports block scheduling?
 * The passed {name} is checked against the PHP var which sets out
 * which blocks are supported.
 *
 * @param {string} name The name of the block.
 */
function isValidBlockType( name ) {

	return validBlockTypes.includes( name );

}// end isValidBlockType()

/**
 * Filters registered block settings, extending attributes with anchor using ID
 * of the first node.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
export function addAttribute( settings ) {

	// If this block supports scheduling, add our custom attribute
	if ( isValidBlockType( settings.name ) ) {

		// Use Lodash's assign to gracefully handle if attributes are undefined
		settings.attributes = assign( settings.attributes, {
			scheduledStart: {
				type: 'string',
			},
		} );
	}

	return settings;

}// end addAttribute()

/**
 * Override the default edit UI to include a new block inspector control for
 * assigning the anchor ID, if block supports anchor.
 *
 * @param {function|Component} BlockEdit Original component.
 *
 * @return {string} Wrapped component.
 */
export const MyWithInspectorControl = createHigherOrderComponent( ( BlockEdit ) => {

	return ( props ) => {

		// If this block supports scheduling and is currently selected, add our UI
		if ( isValidBlockType( props.name ) && props.isSelected ) {
			return (
				<Fragment>
					<BlockEdit { ...props } />
					<InspectorControls>
						<PanelBody title={ __( 'Block Scheduling' ) }>
							<TextControl
								label={ __( 'Scheduled Start Date' ) }
								help={ __( 'When this block should be published.' ) }
								value={ props.attributes.scheduledStart || '' }
								onChange={ ( nextValue ) => {
									props.setAttributes( {
										scheduledStart: nextValue,
									} );
								} } />
						</PanelBody>
					</InspectorControls>
				</Fragment>
			);
		}

		return <BlockEdit { ...props } />;
	};
}, 'MyWithInspectorControl' );

/**
 * Override props assigned to save component to inject anchor ID, if block
 * supports anchor. This is only applied if the block's save result is an
 * element and not a markup string.
 *
 * @param {Object} extraProps Additional props applied to save element.
 * @param {Object} blockType  Block type.
 * @param {Object} attributes Current block attributes.
 *
 * @return {Object} Filtered props applied to save element.
 */
export function addSaveProps( extraProps, blockType, attributes ) {

	// If the current block supports scheduling, add our prop.
	if ( isValidBlockType( blockType.name ) ) {
		extraProps.scheduledStart = attributes.scheduledStart;
	}

	return extraProps;
}// end addSaveProps()

addFilter( 'blocks.registerBlockType', 'scheduled-blocks/add-attribute', addAttribute );
addFilter( 'editor.BlockEdit', 'scheduled-blocks/with-inspector-control', MyWithInspectorControl );
addFilter( 'blocks.getSaveContent.extraProps', 'scheduled-blocks/save-props', addSaveProps );
