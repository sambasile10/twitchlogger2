import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { resourceLimits } from 'worker_threads';
import './App.css';
import Header from './components/Header';
import Log from './components/Log';
import PageControls from './components/PageControls';
import UserInfo from './components/UserInfo';

export declare type Message = {
  timestamp: string,
  message: string
};

export declare type UserInfoData = {
  user_id: string
  view_count: string
  profile_image_url: string
  account_creation_date: string
};

type AppState = {
    messages: Message[]
    user_info: UserInfoData
    subelements_visible: boolean // Show subelements (PageControls, UserInfo)
};

const dummyMessages: Message[] = [
    { timestamp: '2021-12-28T00:15:45.754Z', message: 'MODS blupes' },
    { timestamp: '2021-12-27T23:56:47.964Z', message: 'Bing bang boom EZ' },
    { timestamp: '2021-12-27T23:40:14.099Z', message: 'Pog' },
];

const dummyChannels: string[] = [
  'sodapoppin', 'nyanners'
];

const dummyUserInfo: UserInfoData = {
    user_id: '', view_count: '', profile_image_url:'', account_creation_date: ''
};

const default_state: AppState = {
    messages: dummyMessages,
    user_info: dummyUserInfo,
    subelements_visible: false
};

class App extends React.Component<{}, AppState> {

    constructor(props: any) {
        super(props);

        this.state = default_state;
    }

    performSearch = (channel: string, username: string) => {
        fetch(`/chat/${channel}?username=${username}&limit=50&skip=0`)
          .then(res => res.json())
          .then((result) => {
              const newUserData: UserInfoData = {
                user_id: result.userdata.id,
                view_count: result.userdata.view_count,
                profile_image_url: result.userdata.profile_image_url,
                account_creation_date: result.userdata.created_at
              };
              this.setState({ messages: result.messages, user_info: newUserData, subelements_visible: true });
          }, (error) => {
              this.setState({ messages: [{ timestamp: '', message: 'error' }], subelements_visible: false });
          });
    }

    render() {
        return (
          <div>
            <Container fluid>
              <Row id="header-row" className="search-row">
                <Header onSearchCallback={this.performSearch} />
              </Row>
            </Container>
            <Log messages={this.state.messages}/>
            <Container fluid>
              <Row>
                <Col>
                  <UserInfo user_data={this.state.user_info} visible={this.state.subelements_visible} />
                </Col>
                <Col>
                  <div className="page-controls"><PageControls visible={this.state.subelements_visible} /></div>
                </Col>
              </Row>
            </Container>
            
          </div>
        );
    }
}

export default App;
