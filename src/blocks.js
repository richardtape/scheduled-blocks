/**
 * WordPress dependencies
 */
const { assign } = lodash;
const { __ } = wp.i18n;
const { Fragment } = wp.element;
const { addFilter } = wp.hooks;
const { TextControl, PanelBody, DateTimePicker, Dropdown } = wp.components;
const { createHigherOrderComponent, withState } = wp.compose;
const { InspectorControls } = wp.editor;
const { getSettings } = wp.date;

import './editor.scss';

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
 * Filters registered block settings, extending attributes with our schedule data.
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
			scheduledEnd: {
				type: 'string',
			}
		} );
	}

	return settings;

}// end addAttribute()

/**
 * To know if the current timezone is a 12 hour time with look for "a" in the time format.
 * We also make sure this a is not escaped by a "/".
 * @param {string} time
 * @return bool
 */
function isTwelveHourTime( time ) {

	var test = /a(?!\\)/i.test(
		time
			.toLowerCase() // Test only the lower case a
			.replace( /\\\\/g, '' ) // Replace "//" with empty strings
			.split( '' ).reverse().join( '' ) // Reverse the string and test for "a" not followed by a slash
	);

	return test;

}// end isTwelveHourTime()

/**
 * Override the default edit UI to include a new block inspector control for
 * assigning the scheduling, if block supports scheduling.
 *
 * @param {function|Component} BlockEdit Original component.
 *
 * @return {string} Wrapped component.
 */
export const addScheduledBlockControls = createHigherOrderComponent( ( BlockEdit ) => {

	return ( props ) => {

		const ScheduledBlocksScheduleEndDateTimePicker = withState( {
			date: new Date(),
		} )( ( { date, setState } ) => {

			const settings     = getSettings();
			const is12HourTime = isTwelveHourTime( settings.formats.time );

			// If we have a date saved in props, use that. Otherwise, use the current date.
			return (
				<DateTimePicker
					currentDate={ props.attributes.scheduledEnd || date }
					onChange={ ( newDate ) => {
						setState( { newDate } );
						props.setAttributes( {
							scheduledEnd: newDate,
						} );
					} }
					locale={ settings.l10n.locale }
					is12Hour={ is12HourTime }
					/>
			);
		} );

		const ScheduledBlocksScheduleStartDateTimePicker = withState( {
			date: new Date(),
		} )( ( { date, setState } ) => {

			const settings     = getSettings();
			const is12HourTime = isTwelveHourTime( settings.formats.time );

			// If we have a date saved in props, use that. Otherwise, use the current date.
			return (
				<DateTimePicker
					currentDate={ props.attributes.scheduledStart || date }
					onChange={ ( newDate ) => {
						setState( { newDate } );
						props.setAttributes( {
							scheduledStart: newDate,
						} );
					} }
					locale={ settings.l10n.locale }
					is12Hour={ is12HourTime }
					/>
			);
		} );

		// If this block supports scheduling and is currently selected, add our UI
		if ( isValidBlockType( props.name ) && props.isSelected ) {
			return (
				<Fragment>
					<BlockEdit { ...props } />
					<InspectorControls>
						<PanelBody title={ __( 'Block Scheduling' ) }>
							<Dropdown
								className="scheduled-blocks-start-date-dropdown"
								contentClassName="scheduled-blocks-start-date-popover"
								position="bottom center"
								renderToggle={ ( { isOpen, onToggle } ) => (
									<TextControl
										label={ __( '📅 Scheduled Start Date' ) }
										onClick={ onToggle }
										aria-expanded={ isOpen }
										help={ __( 'When this block should be published.' ) }
										value={ props.attributes.scheduledStart || '' }
										onChange={ ( nextValue ) => {
											props.setAttributes( {
												scheduledStart: nextValue,
											} );
										} }
									/>
								) }
								renderContent={ () => <ScheduledBlocksScheduleStartDateTimePicker /> }
							/>

							<Dropdown
								className="scheduled-blocks-end-date-dropdown"
								contentClassName="scheduled-blocks-end-date-popover"
								position="bottom center"
								renderToggle={ ( { onToggle, isOpen } ) => (
									<TextControl
										label={ __( '📅 Scheduled End Date' ) }
										onClick={ onToggle }
										aria-expanded={ isOpen }
										help={ __( 'When this block should be unpublished.' ) }
										value={ props.attributes.scheduledEnd || '' }
										onChange={ ( nextValue ) => {
											props.setAttributes( {
												scheduledEnd: nextValue,
											} );
										} }
									/>
								) }
								renderContent={ () => <ScheduledBlocksScheduleEndDateTimePicker /> }
							/>

						</PanelBody>
					</InspectorControls>
				</Fragment>
			);
		}

		return <BlockEdit { ...props } />;
	};
}, 'addScheduledBlockControls' );

/**
 * Override props assigned to save component to inject our scheduled date and time.
 * This is only done if the component is a block type on which you can schedule.
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
		extraProps.scheduledEnd = attributes.scheduledEnd;
	}

	return extraProps;

}// end addSaveProps()

addFilter( 'blocks.registerBlockType', 'scheduled-blocks/add-attribute', addAttribute );
addFilter( 'editor.BlockEdit', 'scheduled-blocks/with-inspector-control', addScheduledBlockControls );
addFilter( 'blocks.getSaveContent.extraProps', 'scheduled-blocks/save-props', addSaveProps );
