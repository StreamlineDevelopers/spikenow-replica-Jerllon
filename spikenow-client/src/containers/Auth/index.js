import { useContext, useState, useEffect } from "react";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import myAxios from "../../utils/connection";
import { AuthorizedUserContext } from "../../components/AuthorizedRoutes";
import ChatBody from "./ChatBody";
import ChatSideBar from "./ChatSideBar";
import ChatBox from "./ChatBox";
import ChatBubble from "./ChatBubble";
import socket from "../../socket";

const stripContact = (string) => {
  let email = string.substring(
    string.lastIndexOf("<") + 1,
    string.lastIndexOf(">")
  );

  if (email) {
    let name = string.substr(0, string.indexOf("<"));
    name = name.replace(/['"]+/g, "");
    return { email, name };
  }
  return string;
};

const sortEmail = (userEmail, emails, isDuplicate = true, sort = "desc") => {
  let prevSender = [];
  const reduce = emails.reduce(function (filtered, option) {
    // return filtered.includes(option) ? filtered : [...filtered, option];
    const { id, snippet, payload } = option;
    const senderString = payload.headers.find((data) => {
      return data.name === "From" || data.name === "from";
    });

    const receiverString = payload.headers.find((data) => {
      return data.name === "To" || data.name === "to";
    });

    const strippedFrom = stripContact(senderString.value);
    const strippedTo = stripContact(receiverString.value);

    const sender = {
      name: strippedFrom.name ? strippedFrom.name : strippedFrom,
      email: strippedFrom.email ? strippedFrom.email : strippedFrom,
    };

    const receiver = {
      name: strippedTo.name ? strippedTo.name : strippedTo,
      email: strippedTo.email ? strippedTo.email : strippedTo,
    };

    let contact = {
      name: sender.name,
      email: sender.email,
    };

    if (sender.email === userEmail) {
      contact.email = receiver.email;
      contact.name = receiver.name;
    }

    const subject = payload.headers.find((data) => {
      return data.name === "Subject" || data.name === "subject";
    });

    const date = payload.headers.find((data) => {
      return data.name === "Date" || data.name === "date";
    });

    const time = new Date(date.value);

    let content = snippet;

    if (!isDuplicate) {
      if (payload.mimeType === "text/plain") {
        let buff = new Buffer(payload.body.data, "base64");
        content = buff.toString("ascii");
      } else {
        if (payload.parts[0].body.data) {
          let buff = new Buffer(payload.parts[0].body.data, "base64");
          content = buff.toString("ascii");
        }
      }
    }

    if (
      prevSender.length > 0 &&
      prevSender.includes(contact.email) &&
      isDuplicate
    ) {
      return filtered;
    }
    prevSender.push(contact.email);

    filtered.push({
      id,
      contact,
      sender,
      receiver,
      subject,
      snippet,
      time,
      content,
    });

    return filtered;
  }, []);

  let sortedEmail = reduce.slice().sort((a, b) => b.time - a.time);

  if (sort === "asc") {
    sortedEmail = reduce.slice().sort((a, b) => a.time - b.time);
  }

  return sortedEmail;
};

async function getEmails() {
  console.log("getting");
  const res = await myAxios.get("/getEmails");
  const data = await res.data;
  return data;
}

async function getMessages(email, userEmail) {
  const res = await myAxios.get(`/getMessages/${email}`);
  const data = await res.data;
  const sortedMessages = sortEmail(userEmail, data, false, "asc");
  return sortedMessages;
}

async function sendMessage(selectedEmail, message) {
  const res = await myAxios.post("/email", {
    to: selectedEmail,
    subject: "This message is from SpikeNow Replica",
    message: message,
  });
  const data = await res.json();
  // alert(data.message);
  return data;
}

const Chat = () => {
  const { userInfo } = useContext(AuthorizedUserContext);
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [showBody, setShowBody] = useState(false);
  const [message, setMessage] = useState("");
  const [bubble, setBubble] = useState();
  const [isSending, setIsSending] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);

  useEffect(() => {
    if (!isSending) {
      getEmails().then((emails) => {
        const sortedEmails = sortEmail(userInfo.email, emails);
        setEmails(sortedEmails);
        console.log("useEff got it");
      });
    }
  }, [isSending]);

  useEffect(() => {
    socket.connect();
    socket.on("private message", ({ content, from, to }) => {
      const user = connectedUsers.find((user) => user.userID === from);

      if (user && user.email === selectedEmail) {
        getMessages(user.email, userInfo.email).then((selectedMessages) => {
          console.log("message box");
          const chat = selectedMessages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ));
          setBubble(chat);
          console.log("chatloaded");
        });
      }
      setIsSending(true);
      setIsSending(false);
    });

    socket.on("users", (users) => {
      setConnectedUsers(users);
    });

    socket.on("user connected", (user) => {
      setConnectedUsers([...connectedUsers, user]);
    });

    // socket.on("user disconnected", () => {
    //   socket.removeAllListeners("private message");
    // });

    return () => {
      socket.off("users");
      socket.off("private message");
      socket.off("user connected");
      socket.off("user disconnected");
    };
  });

  const setSelectedContact = async (email, name) => {
    setSelectedName(name);
    setSelectedEmail(email);
    setShowBody(true);

    setIsChatLoading(true);
    getMessages(email, userInfo.email).then((selectedMessages) => {
      const chat = selectedMessages.map((message) => (
        <ChatBubble key={message.id} message={message} />
      ));
      setBubble(chat);
      setIsChatLoading(false);
      console.log("chatloaded");
    });
  };

  const chatBox = () => {
    return emails.reduce((filtered, email) => {
      const { id, contact, sender, receiver, subject, snippet, time } = email;

      if (sender.email !== receiver.email) {
        filtered.push(
          <ChatBox
            contact={contact.name}
            subject={subject ? subject.value : ""}
            snippet={snippet}
            receiver={receiver}
            onClick={setSelectedContact}
            email={contact.email}
            time={`${(time.getHours() < 10 ? "0" : "") + time.getHours()}:${
              (time.getMinutes() < 10 ? "0" : "") + time.getMinutes()
            }`}
            key={id}
          />
        );
      }
      return filtered;
    }, []);
  };

  const onSend = async () => {
    console.log("sending");
    setIsSending(true);
    if (!selectedEmail) {
      alert("no email selected");
      setIsSending(false);
      return;
    }

    if (!message) {
      alert("Please enter a message");
      setIsSending(false);
      return;
    }
    sendMessage(selectedEmail, message)
      .then((response) => {
        const email = sortEmail(
          userInfo.email,
          [response.messageSent],
          false,
          "asc"
        );
        const oneBubble = <ChatBubble key={email[0].id} message={email[0]} />;
        setBubble([...bubble, oneBubble]);
        const socketReceiver = connectedUsers.find(
          (user) => user.email === selectedEmail
        );
        console.log("Emitted", connectedUsers, selectedEmail);
        if (socketReceiver) {
          socket.emit("private message", {
            content: message,
            to: socketReceiver.userID,
          });
        }

        setIsSending(false);
      })
      .catch((error) => console.log(error));

    setMessage("");
  };

  return (
    <Container fluid>
      <Row>
        <Col
          md={4}
          className="border border-bottom-0 border-top-0 m-0 p-0 min-vh-100 d-flex flex-column"
        >
          <ChatSideBar chatBoxes={chatBox()} />
        </Col>
        <Col
          md={8}
          className="border-0 m-0 p-0 bg-light min-vh-100 d-flex flex-column"
        >
          {isChatLoading ? (
            <div
              style={{
                position: "absolute",
                top: "0",
                left: "0",
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(255,255,255,0.9)",
                zIndex: "10",
              }}
              className="d-flex justify-content-center align-items-center"
            >
              <Spinner
                as="span"
                animation="grow"
                size="xl"
                role="status"
                aria-hidden="true"
              />
            </div>
          ) : (
            ""
          )}
          <ChatBody
            onSubmit={onSend}
            senderName={selectedName}
            message={message}
            setMessage={setMessage}
            isShowBody={showBody}
            setShowBody={setShowBody}
            bubble={bubble}
            isSending={isSending}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default Chat;
