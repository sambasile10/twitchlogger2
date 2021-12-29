import React, { Fragment } from 'react';
import { UserInfoData } from '../App';

type UserInfoProps = {
    user_data: UserInfoData
};

class UserInfo extends React.Component<UserInfoProps, {}> {
    constructor(props: any) {
        super(props);
    }

    render() {
        return (
            <Fragment>
                <div className='d-flex flex-row justify-content-center'>
                    <div id="user-id-field" className='p-2'>
                        <p><b>User ID:</b> { this.props.user_data.user_id }</p>
                    </div>
                    <div id="view-count-field" className='p-2'>
                        <p><b>View Count:</b> { this.props.user_data.view_count }</p>
                    </div>
                    <div id="creation-date-field" className='p-2'>
                        <p><b>Account Created:</b> { this.props.user_data.account_creation_date }</p>
                    </div>
                </div>
            </Fragment>
        );
    }

}

export default UserInfo;