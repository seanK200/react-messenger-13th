import React from 'react';
import {
  ChatFill,
  GearFill,
  PeopleFill,
  PersonFill,
} from 'react-bootstrap-icons';
import { Switch, Route, NavLink, Link, useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { useContacts } from '../contexts/ContactsProvider';
import { useRooms } from '../contexts/RoomsProvider';
import RequireLogin from './RequireLogin';

const StyledNavbar = styled.div`
  bakcground: white;
  color: black;
  border: 1px solid #d6d5d5;
  padding: 0 25px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  height: 90px;
`;

const CurrentLocation = styled.div`
  & * {
    padding: 0;
    margin: 0;
  }
  & h1 {
    font-size: 1.5em;
    font-weight: bold;
  }
  & p {
    margin-top: 3px;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    font-size: 0.8em;
    font-weight: normal;
    color: gray;
  }
  & p button {
    border: none;
    border-radius: 3px;
    outline: none;
    background: none;
    padding: 1px;
    margin: 0 5px 0 0;
    color: #0e388a;
  }
  & p button:hover {
    padding: 1px 5px;
    background: #c6d8fc;
  }
`;

const Links = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
`;

const LinkItem = styled.div`
  margin-left: 25px;
  & * {
    margin: 0;
  }
  &:hover {
    & * {
      color: black;
    }
  }
`;

export default function Navbar() {
  const {
    currentUser,
    deselectUser,
    userActivity,
    getUserById,
  } = useContacts();
  const { selectedRoom, leaveRoom, enterRoom } = useRooms();
  const history = useHistory();

  const CurrentUser = () => {
    if (currentUser !== null) {
      return (
        <>
          <PersonFill />
          {`${currentUser.userName}(${currentUser.userId})`}&nbsp;&nbsp;
        </>
      );
    } else {
      return <></>;
    }
  };

  const handleLogoutClick = () => {
    if (window.confirm('로그아웃하시겠습니까?')) {
      deselectUser();
      // window.location = "/auth/login";
      history.push('/auth/login');
    }
    userActivity(currentUser.userId);
  };

  const handleLeaveRoomClick = () => {
    if (window.confirm(`'${selectedRoom.roomName}'에서 나가시겠습니까?`)) {
      const userId = currentUser.userId;
      const roomId = selectedRoom.roomId;

      leaveRoom(userId, roomId);
      userActivity(currentUser.userId);
      // window.location = '/rooms';
      history.push('/rooms');
    }
  };

  const handleInviteUserClick = () => {
    let userIds = window.prompt(
      '초대할 사람의 @아이디 를 공백으로 구분하여 입력하세요',
      ''
    );
    const roomId = selectedRoom.roomId;
    if (userIds !== '' && userIds !== null) {
      userIds = userIds.split(' ');
      userIds = userIds.map((userId) =>
        userId.slice(userId[0] === '@' ? 1 : 0)
      );
      let failedUserIds = [];
      userIds.forEach((userId) => {
        if (getUserById(userId)) {
          enterRoom(userId, roomId);
        } else {
          failedUserIds.push(userId);
        }
      });
      if (failedUserIds.length > 0) {
        let alertString = `${failedUserIds.length.toString()}명의 사용자를 찾지 못해 초대에 실패하였습니다. (`;
        for (let i = 0; i < failedUserIds.length; i++) {
          alertString += '@' + failedUserIds[i];
          if (i < failedUserIds.length - 1) alertString += ', ';
        }
        alert(alertString + ')');
      }
      userActivity(currentUser.userId);
    }
  };

  return (
    <StyledNavbar>
      <CurrentLocation>
        <Switch>
          <Route path="/room/:id">
            <RequireLogin />
            <Link to="/rooms">
              <h1>채팅</h1>
            </Link>
            {selectedRoom === null ? (
              ''
            ) : (
              <p>
                <>
                  <PeopleFill />
                  &nbsp;{selectedRoom ? selectedRoom.participants.length : ''}
                  &nbsp;&nbsp;
                </>
                <button onClick={handleInviteUserClick}>초대하기</button>
                <button onClick={handleLeaveRoomClick}>방 나가기</button>
              </p>
            )}
          </Route>
          <Route path="/rooms">
            <RequireLogin />
            <h1>채팅</h1>
            <p>
              <CurrentUser />
              <button onClick={handleLogoutClick}>로그아웃</button>
            </p>
          </Route>
          <Route path="/friend/:id">
            <h1>프로필</h1>
            <p>
              <Link to="/friends">
                <button>친구 목록</button>
              </Link>
              <button onClick={handleLogoutClick}>로그아웃</button>
            </p>
          </Route>
          <Route path="/friends">
            <RequireLogin />
            <h1>친구</h1>
            <p>
              <CurrentUser />
              <button onClick={handleLogoutClick}>로그아웃</button>
            </p>
          </Route>
          <Route path="/settings">
            <RequireLogin />
            <h1>설정</h1>
            <p>
              <CurrentUser />
              <button onClick={handleLogoutClick}>로그아웃</button>
            </p>
          </Route>
          <Route path="/signup">
            <h1>계정 생성</h1>
          </Route>
          <Route path="/auth/login">
            <h1>로그인</h1>
          </Route>
          <Route exact path="/">
            <h1>홈</h1>
          </Route>
          <Route path="*">
            <h1>Error</h1>
            <p>잘못된 URL (404)</p>
          </Route>
        </Switch>
      </CurrentLocation>
      <Links>
        <LinkItem>
          <NavLink
            to="/friends"
            style={{ fontSize: '1.5rem', color: 'gray' }}
            activeStyle={{ color: '#0E388A' }}
          >
            <PeopleFill />
          </NavLink>
        </LinkItem>
        <LinkItem>
          <NavLink
            to="/rooms"
            style={{ fontSize: '1.35rem', color: 'gray' }}
            activeStyle={{ color: '#0E388A' }}
          >
            <ChatFill />
          </NavLink>
        </LinkItem>
        <LinkItem>
          <NavLink
            to="/settings"
            style={{ fontSize: '1.4rem', color: 'gray' }}
            activeStyle={{ color: '#0E388A' }}
          >
            <GearFill />
          </NavLink>
        </LinkItem>
      </Links>
    </StyledNavbar>
  );
}
