import { channel } from 'diagnostics_channel';
import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { resourceLimits } from 'worker_threads';
import './App.css';
import Header from './components/Header';
import Log from './components/Log';
import PageControls from './components/PageControls';
import UserInfo from './components/UserInfo';
import * as util from './Util';

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
    selected_timeframe: number // Option # of the selected timeframe
    metrics_time: number // Execution time of the last query
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
    selected_timeframe: 0,
    metrics_time: 0,
    user_info: dummyUserInfo,
    subelements_visible: false
};

class App extends React.Component<{}, AppState> {

    constructor(props: any) {
        super(props);

        this.state = default_state;
    }

    componentDidMount() {
        // Load initial timeframe option
        this.setState({
            timeframes: [ util.getInitialDateTuple() ],
            time_options: [ util.getInitialTimeframeOption() ]
        });

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
        const option: DateTuple = this.state.timeframes[this.state.selected_timeframe];
        console.log("Option:", option.month, "/", option.year);
        fetch(`/chat/${channel}?username=${username}&month=${option.month}&year=${option.year}`)
          .then(res => res.json())
          .then((result) => {
              const newUserData: UserInfoData = {
                user_id: result.userdata.id,
                view_count: result.userdata.view_count,
                profile_image_url: result.userdata.profile_image_url,
                account_creation_date: result.userdata.created_at
              };

              let timeframes: DateTuple[] = util.getTimeframes(result.tables);
              this.setState({ 
                messages: result.messages,
                channel: channel,
                timeframes: timeframes,
                time_options: util.formatTimeOptions(timeframes),
                user_info: newUserData,
                metrics_time: result.metrics.duration,
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

    onChangeTimeframe = (option: number) => {
        this.setState({
            selected_timeframe: option
        });

        console.log(option);
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
            <div className="page-footer">
              <Container fluid>
                <Row>
                  <Col my-auto md={6}>
                    <UserInfo user_data={this.state.user_info} metrics_time={this.state.metrics_time} visible={this.state.subelements_visible} />
                  </Col>
                  <Col md={6}>
                    <PageControls 
                      timeframes={this.state.timeframes} 
                      options={this.state.time_options}
                      visible={this.state.subelements_visible} 
                      onChangeTimeframe={this.onChangeTimeframe}
                    />
                  </Col>
                </Row>
              </Container>
            </div>
            
          </div>
        );
    }
}

export default App;
