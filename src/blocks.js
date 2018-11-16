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
// const { getSettings } = wp.date;
const { __experimentalGetSettings } = wp.date;

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
 *
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
 * Add a class to the classList to the passed block ID.
 *
 * @param {string} ID The ID of the block to which we want to add the class.
 */
function addToClassList( ID ) {

	const domID     = 'block-' + ID;
	const thisBlock = document.getElementById( domID );

	thisBlock.classList.add( 'scheduled-block-content' );

}// end addToClassList

/**
 * Add a custom className to blocks which are scheduled.
 */
export const addCustomClassName = createHigherOrderComponent( ( BlockEdit ) => {

	return ( props ) => {

		// Ensure that we have a scheduledStart or scheduledEnd
		if ( ( typeof props.attributes.scheduledStart === "undefined" || "" === props.attributes.scheduledStart ) && ( typeof props.attributes.scheduledEnd === "undefined" || "" === props.attributes.scheduledEnd ) ) {
			return <BlockEdit { ...props } />;
		}

		// OK, yep, we have a non-empty schedule, so let's add an icon.
		let className = props.attributes.className || '';
        className += ' scheduled-block-content';

        const rest = {
            ...props,
            attributes: {
                ...props.attributes,
                className,
            },
		};

        return <BlockEdit {...rest} />
	}

}, 'addCustomClassName' );

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

		if ( ! isValidBlockType( props.name ) || ! props.isSelected ) {
			return <BlockEdit { ...props } />;
		}

		const ScheduledBlocksScheduleEndDateTimePicker = withState( {
			date: new Date(),
		} )( ( { date, setState } ) => {

			const settings     = __experimentalGetSettings();
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
						addToClassList( props.clientId );
					} }
					locale={ settings.l10n.locale }
					is12Hour={ is12HourTime }
					/>
			);
		} );

		const ScheduledBlocksScheduleStartDateTimePicker = withState( {
			date: new Date(),
		} )( ( { date, setState } ) => {

			const settings     = __experimentalGetSettings();
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
						// add css style to block
						addToClassList( props.clientId );
					} }
					locale={ settings.l10n.locale }
					is12Hour={ is12HourTime }
					/>
			);
		} );

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
									label={ __( 'Scheduled Start Date/Time' ) }
									onClick={ onToggle }
									aria-expanded={ isOpen }
									help={ __( 'When this block will be shown.' ) }
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
									label={ __( 'Scheduled End Date/Time' ) }
									onClick={ onToggle }
									aria-expanded={ isOpen }
									help={ __( 'When this block will stop being shown.' ) }
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
		extraProps.scheduledstart = attributes.scheduledStart;
		extraProps.scheduledend   = attributes.scheduledEnd;
	}

	// If this block already has a non-empty schedule, add a custom class.
	if ( typeof extraProps.scheduledstart === "undefined" && typeof extraProps.scheduledend === "undefined" ) {
		return extraProps;
	}

	// At least one of our extra props has a value, add our class
	var currentClassName = extraProps.className;

	var newClassName = ( typeof currentClassName === 'undefined' || currentClassName === 'undefined' ) ? 'scheduled-block-content' : currentClassName + ' scheduled-block-content';

	extraProps.className = newClassName;
	return extraProps;

}// end addSaveProps()

addFilter( 'blocks.registerBlockType', 'scheduled-blocks/add-attribute', addAttribute );
addFilter( 'editor.BlockEdit', 'scheduled-blocks/with-inspector-control', addScheduledBlockControls );
addFilter( 'blocks.getSaveContent.extraProps', 'scheduled-blocks/save-props', addSaveProps );
addFilter( 'editor.BlockEdit', 'scheduled-blocks/add-custom-class-name', addCustomClassName );