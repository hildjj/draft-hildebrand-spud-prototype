---
title: Session Protocol for User Datagrams (SPUD) Prototype
abbrev: I-D
docname: draft-hildebrand-spud-prototype-00
date: 2015-2-5
category: info
ipr: trust200902

author:
 -
    ins: J. Hildebrand
    name: Joe Hildebrand
    organization: Cisco Systems
    email: jhildebr@cisco.com
 -
    ins: B. Trammell
    name: Brian Trammell
    organization: ETH Zurich
    email: ietf@trammell.ch

normative:
  RFC2119:
  RFC3168:
  RFC4443:
  RFC5646:
  RFC7049:

informative:
  RFC1149:

--- abstract

SPUD is a prototype for grouping UDP packets together in a session, also
allowing network devices on the path between endpoints to participate
explicitly in the session outside the end-to-end context.

--- middle

# Introduction

The goal of SPUD (Session Protocol for User Datagrams) is to provide a mechanism
for grouping UDP packets together into a session with a defined beginning and
end.  Devices on the network path between the endpoints speaking SPUD may
communicate explicitly with the endpoints outside the context of the end-to-end
conversation.

The SPUD protocol is a prototype, intended to promote further discussion of
potential use cases within the framework of a concrete approach.  To move
forward, ideas explored in this protocol might be implemented inside another
protocol such as DTLS.

## Terminology

In this document, the key words "MUST", "MUST NOT", "REQUIRED",
"SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY",
and "OPTIONAL" are to be interpreted as described in BCP 14, RFC 2119
{{RFC2119}}.

# Requirements

* Deploy on existing Internet
* No kernel modifications required
* Only widely-available APIs required
* No root permissions required for endpoint applications
* New choices for congestion, retransmit, etc. available in transport protocols
  inside SPUD
* Single firewall-traversal mechanism, multiple transport semantics
* Low overhead
  * Determine SPUD is in use (very fast)
  * Associate packets with a session (relatively fast)
* Policy per-session
* Multiple interfaces for each endpoint

# Lifetime of a session

A session is a grouping of packets between two endpoints on the network.
Sessions are started by the "initiator" expressing an interest in comminicating
with the "responder".  A session may be closed by either endpoint.  

A session may be in one of the following states:

* unknown: no information is currently known about the session.  All sessions
  implicitly start in the unknown state.
* opening: the initiator has requested a session that the responder has not yet
  acknowledged.
* running: the session is set up and will allow data to flow
* resuming: an out-of-sequence SPUD packet has been received for this session.
  Policy will need to be developed describing how (or if) this state can be
  exploited for quicker session resumption by higher-level protocols.

This leads to the following state transitions (see {{commands}} for details on
the commands that cause transitions):

    +--------------------+ +-----+
    |                    | |close|
    |                    v |     v
    |      +-----open--- +-------+ <--close----+
    |      |             |unknown|             |
    |      |    +------> +-------+ --ack,-+    |
    |      |    |                    data |    |
    |      |  close                       |    |
    |      v    |                         v    |
    |     +-------+ -------data-------> +--------+
    | +---|opening|                     |resuming|---+
    | |   +-------+ <------open-------- +--------+   |
    | |     ^   |                         |    ^     |
    | |     |   |                         |    |     |
    | +open-+   +-ack--> +-------+ <--ack-+    +-data+
    |                    |running|
    +-------close------- +-------+
                          ^    |
                          |    | open,ack,data
                          +----+
{: #states title="State transitions"}

# Packet layout

SPUD packets are sent inside UDP packets, with the SPUD header directly after
the UDP header.

    0                   1                   2                   3
    0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2
    +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    |                       magic = 0xd80000d8                      |
    +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    |cmd|a|p|                  Session ID                           |
    +-+-+-+-+                                                       +
    |                                                               |
    +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    |                              ...                              |
    +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
{: #packet title="SPUD packets"}

The fields in the packet are:

* 32-bit constant magic number (see {{magic}})
* 2 bits of command (see {{commands}})
* 1 bit marking this packet as an application declaration (adec)
* 1 bit marking this packet as a path declaration (pdec)
* 60 bits defining the id of this session
* Data.  If any of the command, adec, or pdec bits are set, the data is CBOR.

## Detecting usage {#magic}

The first 32 bits of every SPUD packet is the constant bit pattern d80000d8
(hex), or 1101 1000 0000 0000 1101 1000 (binary).  This pattern was selected to
be invalid UTF-8, UTF-16 (both big- and little-endian), and UTF-32 (both big-
and little-endian).  The intent is to ensure that text-based non-SPUD protocols
would not use this pattern by mistake.  A survey of other protocols will be done
to see if this pattern occurs often in existing traffic.

The intent of this magic number is not to provide conclusive evidence that SPUD
is being used in this packet, but instead to allow a very fast way to decide
that SPUD is not in use on packets that do not include the magic number.

## Commands {#commands}

The next 2 bits of a SPUD packet encode a command:

* Data(00): Normal data in a running session
* Open(01): A request to begin a session
* Close(10): A request to end a session
* Ack(11): An acknowledgement to an open request

## Declaration bits

The adec bit is set when the application is making a declaration to the path.
The pdec bit is set when the path is making a declaration to the application.

## Additional information

If any of the command, adec, or pdec bits are set, the following data in the
packet is a CBOR (major type 5).  No fragmentation mechanism is specified yet,
but one is likely needed later.

For Data-command SPUD packets with neither the adec nor the pdec bits set, the
additional information can be any data that the upper-layer protocol desires.

# Initiating a session

CBOR

# Closing a session

CBOR

# Path declarations

SPUD can be used for path declarations: information delivered to the endpoints
from devices along the path. Path declarations can be thought of as enhanced
ICMP for transports using SPUD, allowing information about the condition or
state of the path or the session to be communicated directly to a sender.

Path declarations are always sent directly back to a sender in response to a
SPUD packet. The scope of a path declaration is the session (identified by
Session ID) to which it is associated. Devices along the path cannot make
declarations to endpoints without a session to associate them with.  Path
declarations are sent to one endpoint in a SPUD conversation by the path device
sending SPUD packets with the source IP address and UDP port from the other
endpoint in the conversation.  These "spoofed" packets  are required to allow
existing network elements that pass traffic for a given 5-tuple to continue to
work.  To ensure that the context for these declarations is correct, path
declaration packets MUST have the pdec bit set.

The data associated with a path declaration consists of a CBOR {{RFC7049}} map
(major type 5), which may always have the following keys (and associated
values):

* ipaddr (byte string, major type 2): the IPv4 address or IPv6 address of the
  sender, as an string of 4 or 16 bytes in network order. This is necessary as
  the source IP address of the packet is spoofed
* ttl (unisigned integer, major type 0): IP time to live / IPv6 Hop Limit of
  associated device
* cookie (byte string, major type 2): data that identifies the sending path
  element unambiguously
* url (text string, major type 3): a URL identifying some information about the
  path or its relationship with the session. The URL represents some path
  condition, and retrieval of content at the URL should include a human-readable
  description.
* warning (map, major type 5): a map from text string (major type 3) to text
  string.  The keys are {{RFC5646}} language tags, and the values are strings
  that can be presented to a user that understands that language.  The key "*"
  can be used as the default.

## Path Declaration Vocabulary

The SPUD mechanism is defined to be completely extensible in terms of the types
of path declarations that can be made. However, in order for this mechanism to
be of use, endpoints and devices along the path must share a relatively limited
vocabulary of path declarations. The following subsections briefly explore
declarations we believe may be useful, and which will be further developed on
the background of concrete use cases to be defined as part of the SPUD effort.

Terms in this vocabulary considered universally useful may be added to the SPUD
path declaration map keys, which in this case would then be defined as an IANA
registry.

### ICMP {#icmp}

ICMP {{RFC4443}} (e.g.) messages are sometimes blocked by path elements
attempting to provide  security.  Even when they are delivered to the host, many
ICMP messages are not  made available to applications through portable socket
interfaces.  As such, a path element might decide to copy the ICMP message
into a path declaration, using the following key/value pairs:

* icmp (byte string, major type 2): the full ICMP  (e.g.) payload.
  This is  intended to allow ICMP messages (which may be blocked by the path, or
  not made  available to the receiving application) to be bound to a session.
  Note that  sending a path declaration ICMP message is not a substitute for
  sending a  required ICMP or ICMPv6 message.
* icmp-type (unsigned, major type 0): the ICMP type
* icmp-code (unsigned, major type 0): the ICMP code

Other information from particular ICMP codes may be parsed out into key/value
pairs.

### Explicit congestion notification

Similar to ICMP, getting explicit access to ECN {{RFC3168}} information in
applications can be difficult.  As such, a path element might decide to generate
a path declaration using the following key/value pairs:

* ecn (True, major type 7): congestion has been detected

### Path element identity

Path elements can describe themselves using the following key/value pairs:

* description (text string, major type 3): the name of the software, hardware,
  product, etc. that generated the declaration
* version (text string, major type 3): the version of the software, hardware,
  prodct, etc. that generated the declaration
* caps (byte string, major type 2): a hash of the capabilities of the software,
  hardware, prodct, etc. that generated the declaration [TO BE DESCRIBED]

### Maximum Datagram Size

A path element may tell the endpoint the maximum size of a datagram it is
willing or able to forward for a session, to augment various path MTU discovery
mechanisms.  This declaration uses the following key/value pairs:

* mtu (unsigned, major type 0): the maximum transmission unit (in bytes)

### Rate Limit

A path element may tell the endpoint the maximum data rate (in octets or
packets) that it is willing or able to forward for a session. As all path
declarations are advisory, the device along the path must not rely on the
endpoint to set its sending rate at or below the declared rate limit, and
reduction of rate is not a guarantee to the endpoint of zero queueing delay.
This mechanism is intended for "gross" rate limitation, i.e. to declare that the
output interface is connected to a limited or congested link, not as a
substitute for loss-based or explicit congestion notification on the RTT
timescale.  This declaration uses the following key/value pairs:

* max-byte-rate (unsigned, major type 0): the maximum bandwidth (in bytes per
  second)
* max-packet-rate (unsigned, major type 0): the maximum bandwidth (in packets
  per second)

### Latency Advisory

A path element may tell the endpoint the latency attributable to traversing that
path element. This mechanism is intended for "gross" latency advisories, for
instance to declare the output interface is connected to a satellite or
{{RFC1149}} link.  This declaration uses the following key/value pairs:

* latency (floating point, major type 7): the latency (in seconds)

### Prohibition Report

A path element which refuses to forward a packet may declare why the packet was
not forwarded, similar to the various Destination Unreachable codes of ICMP.  
Further thought will be given to how these reports interact with the ICMP
support from {{icmp}}.

# Declaration reflection

In some cases, a device along the path may wish to send a path declaration but
where the reverse path is not reachable from the device [EDITOR'S NOTE: Bob
Briscoe raised this issue during the SEMI workshop, which has largely to do with
tunnels. It is not clear to me (bht) how a point along the path would know that
it must reflect a declaration, but this is included for completeness] may
instead reflect that declaration. A reflected declaration is a SPUD packet with
both the pdec and adec flags set, and contains the same content as a path
declaration would, but has the same source address and port and destination
address and port as the SPUD packet which triggered it.

When a SPUD endpoint receives a declaration reflection, it SHOULD reflect it:
swapping the source and destination addresses, stripping the adec bit, and
sending it as if it were a path declaration.

Note: this facility will need careful security analysis before it makes it into
any final specification.

# Application declarations

Applications may also use the SPUD mechanism to describe the traffic in the
session to the application on the other side, and/or to any point along the
path. As with path declarations, the scope of an application declaration is the
session (identified by Session ID) to which it is associated.

An application declaration is a SPUD packet with the adec flag set, and contains
an application declaration formatted in CBOR in its payload. As with path
declarations, an application declaration is a CBOR map, which may always have
the following keys:

* cookie (byte string, major type 2): an identifier for this application
  declaration, used to address a particular path element

Unless the cookie matches one sent by the path element for this session, every
device along the path MUST forward application declarations on towards the
destination endpoint.

The definition of an application declaration vocabulary is left as future work;
we note only at this point that the mechanism supports such declarations.

# Errors

CBOR.

# Security Considerations

This gives you ability to expose information about the mumble

# IANA Considerations

## Operations

## May want an IP protocol number
