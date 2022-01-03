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

// Information from the current query
export declare type UserInfoData = {
    user_id: string // Twitch ID of user
    view_count: string // View count of user
    profile_image_url: string // Profile image of user
    account_creation_date: string // Account creation date of user
    metrics_time: number // Execution time of the query
    number_results: number // Number of messages from the query
};

// Used for determining which table to query
export declare type DateTuple = {
    month: number,
    year: number
};

// Package of data involving timeframes
export declare type TimeframeData = {
    timeframes: DateTuple[], // List of avalible month/year combinations for selected channel
    options: string[] // Readable version of the timeframes tuples array
};

type AppState = {
    messages: Message[] // Messages to be displayed in the Log component
    channel: string // Currently selected channel
    channels: string[] // List of channels being tracked
    timeframe_data: TimeframeData // Timeframe data
    selected_timeframe: number // Option # of the selected timeframe
    user_info: UserInfoData // User info to be displayed 
    subelements_visible: boolean // Show subelements (PageControls, UserInfo)
};

const dummyUserInfo: UserInfoData = {
    user_id: '', view_count: '', profile_image_url:'', account_creation_date: '',
    metrics_time: 0, number_results: 0
};

const dummyTimeframeData: TimeframeData = {
    timeframes:  [{ month: 0, year:0 }], options: ['0/0']
};

const default_state: AppState = {
    messages: [],
    channel: '',
    channels: [],
    timeframe_data: dummyTimeframeData,
    selected_timeframe: 0,
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
            timeframe_data: util.getInitialTimeframeData()
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
        const option: DateTuple = this.state.timeframe_data.timeframes[this.state.selected_timeframe];
        console.log("Option:", option.month, "/", option.year);
        fetch(`/chat/${channel}?username=${username}&month=${option.month}&year=${option.year}`)
          .then(res => res.json())
          .then((result) => {
              const newUserData: UserInfoData = {
                user_id: result.userdata.id,
                view_count: result.userdata.view_count,
                profile_image_url: result.userdata.profile_image_url,
                account_creation_date: result.userdata.created_at,
                metrics_time: result.metrics.duration,
                number_results: result.results
              };

              let newTimeframeData: TimeframeData = util.getTimeframeData(result.tables);
              this.setState({ 
                messages: result.messages,
                channel: channel,
                timeframe_data: newTimeframeData,
                user_info: newUserData,
                subelements_visible: true 
              });
          }, (error) => {
              this.setState({ 
                messages: [{ timestamp: '', message: 'error' }],
                channel: channel,
                timeframe_data: util.getInitialTimeframeData(),
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
                  <Col my-auto md={10}>
                    <UserInfo user_data={this.state.user_info} visible={this.state.subelements_visible} />
                  </Col>
                  <Col md={2}>
                    <PageControls 
                      timeframes={this.state.timeframe_data.timeframes} 
                      options={this.state.timeframe_data.options}
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
