import React, { Fragment } from 'react';
import { Autocomplete, TextField } from '@mui/material';

type HeaderProps = {
    channels: string[] // List of channel options
};

type HeaderState = {
    selectedChannel: string // Currently selected channel
};

class Header extends React.Component<HeaderProps, {}> {

    constructor(props: any) {
        super(props);
    }

    onChangeChannel = (selected: any) => {
        this.setState({ selectedChannel: selected });
    }

    render() {
        return(
            <Fragment>
                <Autocomplete
                    disablePortal
                    id="channel-combo-box"
                    options={this.props.channels}
                    sx={{ width: 300 }}
                    renderInput={(params) => <TextField {... params} label="Channel" />}
                />
            </Fragment>
        )
    }
}

export default Header;