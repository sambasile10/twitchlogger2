import { channel } from 'diagnostics_channel';
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

export declare type DateTuple = {
  month: number,
  year: number
};

type AppState = {
    messages: Message[] // Messages to be displayed in the Log component
    channel: string // Currently selected channel
    channels: string[] // List of channels being tracked
    timeframes: DateTuple[] // List of avalible month/year combinations for selected channel
    time_options: string[] // Readable version of the timeframes tuples array
    user_info: UserInfoData // User info to be displayed 
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
    channel: '',
    channels: [],
    timeframes: [{ month: 0, year: 0 }],
    time_options: ['0/0'],
    user_info: dummyUserInfo,
    subelements_visible: false
};

class App extends React.Component<{}, AppState> {

    constructor(props: any) {
        super(props);

        this.state = default_state;
    }

    componentDidMount() {
        // Load channel list from backend
        fetch('/channels')
            .then(res => res.json())
            .then((result) => {
                console.log(JSON.stringify(result));
                this.setState({
                  channels: result.channels
                });
            },
            (error) => {
                this.setState({
                    channels: [ 'error', ':((' ],
                });
            }
        )
    }

    performSearch = (channel: string, username: string) => {
        const date = new Date();
        fetch(`/chat/${channel}?username=${username}&month=${date.getUTCMonth()+1}&year=${date.getUTCFullYear()}`)
          .then(res => res.json())
          .then((result) => {
              const newUserData: UserInfoData = {
                user_id: result.userdata.id,
                view_count: result.userdata.view_count,
                profile_image_url: result.userdata.profile_image_url,
                account_creation_date: result.userdata.created_at
              };

              let timeframes: DateTuple[] = this.getTimeframes(result.tables);
              this.setState({ 
                messages: result.messages,
                channel: channel,
                timeframes: timeframes,
                time_options: this.formatTimeOptions(timeframes),
                user_info: newUserData,
                subelements_visible: true 
              });
          }, (error) => {
              this.setState({ 
                messages: [{ timestamp: '', message: 'error' }],
                channel: channel,
                timeframes: [],
                subelements_visible: false 
              });
          });
    }

    render() {
        return (
          <div>
            <Container fluid>
              <Row id="header-row" className="search-row">
                <Header channels={this.state.channels} onSearchCallback={this.performSearch} />
              </Row>
            </Container>
            <Log messages={this.state.messages}/>
            <Container fluid>
              <Row>
                <Col>
                  <UserInfo user_data={this.state.user_info} visible={this.state.subelements_visible} />
                </Col>
                <Col>
                  <div className="page-controls">
                    <PageControls 
                      timeframes={this.state.timeframes} 
                      options={this.state.time_options}
                      visible={this.state.subelements_visible} />
                  </div>
                </Col>
              </Row>
            </Container>
            
          </div>
        );
    }

    private getTimeframes(tables: any): DateTuple[] {
        let tuples: DateTuple[] = [];
        for(let i = 0; i < tables.length; i++) {
            const split = String(tables[i].table_name).split('_');
            tuples.push({
                year: Number(split[1]),
                month: Number(split[2])
            } as DateTuple);
            console.log(tables[i]);
        }
        
        return tuples;
    }

    private formatTimeOptions(tuples: DateTuple[]): string[] {
        let options: string[] = [];
        for(let i = 0; i < tuples.length; i++) {
            const tuple: DateTuple = tuples[i];
            options.push(String(tuple.month + "/" + tuple.year));
        }

        return options;
    }
}

export default App;
