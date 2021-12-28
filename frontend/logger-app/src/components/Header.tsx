import React, { Fragment } from 'react';
import { Autocomplete, TextField, Button } from '@mui/material';
import { Col } from 'react-bootstrap';

type HeaderProps = {
    channels: string[] // List of channel options
};

type HeaderState = {
    channels: string[]
    selectedChannel: string // Currently selected channel
};

const default_state = {
    channels: [ 'not ready' ],
    selectedChannel: ''
};

class Header extends React.Component<HeaderProps, {}> {

    constructor(props: any) {
        super(props);

        this.setState(default_state);
    }

    componentDidMount() {
        // Load channel list from backend
        fetch('/channels')
            .then(res => res.json())
            .then((result) => {
                this.setState({
                    channels: result.channels,
                    selectedChannel: ''
                });
            },
            (error) => {
                this.setState({
                    channels: [ 'error', ':((' ],
                    selectedChannel: ''
                });
            }
        )
    }

    onChangeChannel = (selected: any) => {
        this.setState({ selectedChannel: selected });
    }

    render() {
        return(
            <Fragment>
                <div className='d-flex flex-row justify-content-center'>
                    <div className='p-2'>
                        <Autocomplete
                            disablePortal
                            id="channel-combo-box"
                            options={this.state.channels}
                            sx={{ width: 220 }}
                            renderInput={(params) => <TextField {... params} label="Channel" />}
                        />
                    </div>
                    <div className='p-2'>
                        <TextField
                            id="username-text-field"
                            label="Username"
                            variant="filled"
                            fullWidth={true}
                        />
                    </div>
                    <div className='p-2'>
                        <Button style={{ height: '100%' }} id="search-button" variant='contained'>
                            Search
                        </Button>
                    </div>
                </div>
            </Fragment>
        )
    }
}

export default Header;