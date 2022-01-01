import { Button, MenuItem, Select } from '@mui/material';
import React, { Fragment } from 'react';
import { DateTuple } from '../App';

type PageControlsProps = {
    timeframes: DateTuple[] // Timeframes of selected channel in tuple form
    options: string[] // Readable form of timeframes tuples array
    visible: boolean, // Controls the visibility of the element
    onChangeTimeframe: (option: number) => void // Callback to update selected timeframe in parent state
};

type PageControlsState = {
    selected: number // Currently selected option
    timeframe: DateTuple // Currently selected timeframe
};

const default_state: PageControlsState = {
    selected: 0,
    timeframe: { month: 0, year: 0 }
};

class PageControls extends React.Component<PageControlsProps, PageControlsState> {
    constructor(props: any) {
        super(props);

        this.state = default_state;
    }

    // Called when component props are modified
    /*shouldComponentUpdate() {
        let options: string[] = [];
        for(let i = 0; i < this.props.timeframes.length; i++) {
            const tuple: DateTuple = this.props.timeframes[i];
            options.push(String(tuple.month + "/" + tuple.year));
        }
        
        this.setState({ options: options });
    }*/

    onChangeTimeframe = (event: any) => {
        this.setState({
            selected: event.target.value
        });
        
        this.props.onChangeTimeframe(event.target.value);
    }   

    render() {
        return (
            <Fragment>
                <div className='d-flex flex-row justify-content-center'>
                    <div className='p-2'>
                        <Select
                            labelId="timeframe-select-label"
                            id="timeframe-select"
                            value={this.state.selected}
                            label="Timeframe"
                            onChange={this.onChangeTimeframe}
                        >
                            {
                                this.props.timeframes.map((tuple, index) => (
                                    <MenuItem value={index}>{ this.props.options[index] }</MenuItem>
                                ))
                            }
                        </Select>
                    </div>
                </div>
            </Fragment>
        );
    }
}

export default PageControls;