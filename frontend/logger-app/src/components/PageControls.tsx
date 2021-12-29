import { Button } from '@mui/material';
import React, { Fragment } from 'react';

type PageControlsProps = {
    visible: boolean,
};

type PageControlsState = {
    page_number: number
};

const default_state: PageControlsState = {
    page_number: 1
};

class PageControls extends React.Component<PageControlsProps, PageControlsState> {
    constructor(props: any) {
        super(props);

        this.state = default_state;
    }

    onPreviousPage = () => {
        if(this.state.page_number == 1) {
            return;
        }

        this.setState({ page_number: this.state.page_number-1 });
    }

    onNextPage = () => {
        this.setState({ page_number: this.state.page_number+1 });
    }

    render() {
        return (
            <Fragment>
                <div className='d-flex flex-row justify-content-end'>
                    <div className='p-2'>
                        <Button id="prev-button" variant='contained' onClick={this.onPreviousPage}>
                           Previous
                        </Button>
                    </div>
                    <div className='p-2'>
                        <Button id="next-button" variant='contained' onClick={this.onNextPage}>
                           Next
                        </Button>
                    </div>
                    <div className='p-2'>
                        <p>{ this.state.page_number }</p>
                    </div>
                </div>
            </Fragment>
        );
    }
}

export default PageControls;