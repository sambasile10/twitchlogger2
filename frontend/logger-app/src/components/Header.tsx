import React, { Fragment } from 'react';
import { Autocomplete, TextField, Button } from '@mui/material';
import { Col } from 'react-bootstrap';

type HeaderProps = {
    channels: string[] // List of channel options
    onSearchCallback: (channel: string, username: string) => void // Callback to search logs
};

type HeaderState = {
    selectedChannel: string // Currently selected channel
    usernameValue: string // Value of username text field
};

const default_state: HeaderState = {
    selectedChannel: '',
    usernameValue: ''
};

class Header extends React.Component<HeaderProps, HeaderState> {

    constructor(props: any) {
        super(props);

        this.state = default_state;
    }

    onChangeChannel = (event: any, value: any) => {
        this.setState({ selectedChannel: value });
    }

    onChangeUsername = (e: any) => {
        this.setState({ usernameValue: e.target.value });
    }

    onSearch = () => {
        console.log("channel: " + this.state.selectedChannel + ", username: " + this.state.usernameValue);
        this.props.onSearchCallback(this.state.selectedChannel, this.state.usernameValue);
    }

    render() {
        return(
            <Fragment>
                <div className='d-flex flex-row justify-content-center'>
                    <div className='p-2'>
                        <Autocomplete
                            disablePortal
                            id="channel-combo-box"
                            options={this.props.channels}
                            sx={{ width: 220 }}
                            renderInput={(params) => <TextField {... params} label="Channel" />}
                            onChange={this.onChangeChannel}
                        />
                    </div>
                    <div className='p-2'>
                        <TextField
                            id="username-text-field"
                            label="Username"
                            variant="filled"
                            fullWidth={true}
                            value={this.state.usernameValue}
                            onChange={this.onChangeUsername}
                        />
                    </div>
                    <div className='p-2'>
                        <Button style={{ height: '100%' }} id="search-button" variant='contained' onClick={this.onSearch}>
                            Search
                        </Button>
                    </div>
                </div>
            </Fragment>
        )
    }
}

export default Header;